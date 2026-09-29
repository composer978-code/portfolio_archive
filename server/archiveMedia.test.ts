import { describe, expect, it } from "vitest";
import { decodeArchiveUpload, MAX_ARCHIVE_FILE_BYTES, sanitizeArchiveFileName } from "./archiveMedia";

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("archive media uploads", () => {
  it("recognizes supported image bytes without trusting a filename", () => {
    expect(decodeArchiveUpload(pngBytes.toString("base64"), "image/png", "image").mimeType).toBe("image/png");
    expect(() => decodeArchiveUpload(pngBytes.toString("base64"), "image/jpeg", "image")).toThrow(/일치하지 않습니다/);
  });

  it("accepts PDF and UTF-8 text as document attachments", () => {
    expect(decodeArchiveUpload(Buffer.from("%PDF-1.7").toString("base64"), "application/pdf", "document").mimeType).toBe("application/pdf");
    expect(decodeArchiveUpload(Buffer.from("오늘 저장한 메모").toString("base64"), "text/plain", "document").mimeType).toBe("text/plain");
  });

  it("rejects non-image content in the photo slot and oversized files", () => {
    expect(() => decodeArchiveUpload(Buffer.from("plain text").toString("base64"), "text/plain", "image")).toThrow(/사진을 선택/);
    const oversized = Buffer.alloc(MAX_ARCHIVE_FILE_BYTES + 1, 0x61).toString("base64");
    expect(() => decodeArchiveUpload(oversized, "text/plain", "document")).toThrow(/8MB 이하/);
  });

  it("sanitizes file names so path fragments cannot leave the private namespace", () => {
    expect(sanitizeArchiveFileName("../../personal\u0000-photo.webp")).toBe(".._.._personal_-photo.webp");
  });
});
