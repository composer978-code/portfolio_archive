import { TRPCError } from "@trpc/server";

export const MAX_ARCHIVE_FILE_BYTES = 8 * 1024 * 1024;
export type ArchiveUploadMode = "image" | "document" | "any";

export function sanitizeArchiveFileName(input: string) {
  const name = input.replace(/[\\/\u0000-\u001f\u007f]/g, "_").trim().slice(0, 180);
  return name || "archive-file";
}

function sniffMimeType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (!bytes.includes(0)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return "text/plain";
    } catch {
      // It is not valid plain UTF-8 text.
    }
  }
  return null;
}

export function decodeArchiveUpload(base64: string, declaredMimeType: string | undefined, mode: ArchiveUploadMode) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "파일 데이터를 확인할 수 없습니다." });
  }
  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "빈 파일은 보관할 수 없습니다." });
  }
  if (bytes.byteLength > MAX_ARCHIVE_FILE_BYTES) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "파일은 8MB 이하로 선택해 주세요." });
  }

  const detectedMimeType = sniffMimeType(bytes);
  if (!detectedMimeType) {
    throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE", message: "JPG·PNG·WebP·GIF 사진, PDF 또는 UTF-8 텍스트 파일만 보관할 수 있습니다." });
  }
  const declared = (declaredMimeType ?? "").trim().toLowerCase();
  if (declared && declared !== "application/octet-stream" && declared !== detectedMimeType && !(declared === "image/jpg" && detectedMimeType === "image/jpeg")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "파일 형식 정보와 실제 내용이 일치하지 않습니다." });
  }
  if (mode === "image" && !detectedMimeType.startsWith("image/")) {
    throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE", message: "JPG·PNG·WebP·GIF 사진을 선택해 주세요." });
  }
  if (mode === "document" && !["application/pdf", "text/plain"].includes(detectedMimeType)) {
    throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE", message: "PDF 또는 UTF-8 텍스트 문서를 선택해 주세요." });
  }
  return { bytes, mimeType: detectedMimeType };
}
