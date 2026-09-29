import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parseArchiveVideoUrl } from "../shared/archive-media";
import { router, publicProcedure } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { ARCHIVE_COOKIE, archiveProcedure, createArchiveSession, hasArchiveSession, verifyArchiveCode } from "./archiveAuth";
import {
  createArchiveFile,
  createArchiveItem,
  createJournalEntry,
  deleteJournalEntry,
  listArchiveFiles,
  listArchiveItems,
  listJournalEntries,
  updateArchiveItem,
  updateJournalEntry,
} from "./db";
import { decodeArchiveUpload, MAX_ARCHIVE_FILE_BYTES, sanitizeArchiveFileName } from "./archiveMedia";
import { storageGetSignedUrl, storagePut } from "./storage";

const loginAttempts = new Map<string, { count: number; expiresAt: number }>();
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_BASE64_LENGTH = 11_200_000;
const tagsSchema = z.string().trim().max(500).default("");

function rateLimitKey(ip: string | undefined) {
  return ip || "unknown";
}

function uploadKey(fileName: string) {
  return `private-archive/media/${randomUUID()}-${sanitizeArchiveFileName(fileName)}`;
}

function summaryFromBody(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 240);
}

export const archiveRouter = router({
  status: publicProcedure.query(async ({ ctx }) => ({
    unlocked: await hasArchiveSession(ctx.req),
    configured: Boolean(ENV.archiveAccessCode),
  })),

  unlock: publicProcedure
    .input(z.object({ code: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      if (!ENV.archiveAccessCode) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "아카이브 코드를 아직 설정하지 않았습니다." });
      }
      const key = rateLimitKey(ctx.req.ip);
      const now = Date.now();
      const current = loginAttempts.get(key);
      if (current && current.expiresAt > now && current.count >= ATTEMPT_LIMIT) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해 주세요." });
      }
      if (!verifyArchiveCode(input.code)) {
        const next = current && current.expiresAt > now
          ? { count: current.count + 1, expiresAt: current.expiresAt }
          : { count: 1, expiresAt: now + ATTEMPT_WINDOW_MS };
        loginAttempts.set(key, next);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "코드가 맞지 않습니다." });
      }
      loginAttempts.delete(key);
      const token = await createArchiveSession();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(ARCHIVE_COOKIE, token, {
        ...cookieOptions,
        httpOnly: true,
        sameSite: cookieOptions.secure ? "none" : "lax",
        maxAge: 12 * 60 * 60 * 1000,
      });
      // The token is also returned for per-tab sessionStorage fallback in embedded previews.
      // The access code itself is never returned, stored, or sent back to the browser.
      return { success: true, sessionToken: token } as const;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(ARCHIVE_COOKIE, { ...cookieOptions, sameSite: cookieOptions.secure ? "none" : "lax", maxAge: 0 });
    return { success: true } as const;
  }),

  notes: router({
    list: archiveProcedure.query(() => listJournalEntries()),
    create: archiveProcedure
      .input(z.object({ title: z.string().trim().min(1).max(200), body: z.string().max(50_000) }))
      .mutation(({ input }) => createJournalEntry(input.title, input.body)),
    update: archiveProcedure
      .input(z.object({ id: z.number().int().positive(), title: z.string().trim().min(1).max(200), body: z.string().max(50_000) }))
      .mutation(({ input }) => updateJournalEntry(input.id, input.title, input.body)),
    delete: archiveProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => deleteJournalEntry(input.id)),
  }),

  files: router({
    list: archiveProcedure.query(async () => {
      const records = await listArchiveFiles();
      return Promise.all(records.map(async (file) => ({
        id: file.id,
        fileName: file.fileName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
        downloadUrl: await storageGetSignedUrl(file.fileKey),
      })));
    }),
    upload: archiveProcedure
      .input(z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(160).optional(),
        base64: z.string().min(1).max(MAX_BASE64_LENGTH),
      }))
      .mutation(async ({ input }) => {
        const safeName = sanitizeArchiveFileName(input.fileName);
        const { bytes, mimeType } = decodeArchiveUpload(input.base64, input.mimeType, "any");
        const { key } = await storagePut(uploadKey(safeName), bytes, mimeType);
        await createArchiveFile({ fileName: safeName, mimeType, fileKey: key, fileSize: bytes.byteLength });
        return { success: true, fileName: safeName } as const;
      }),
  }),

  items: router({
    list: archiveProcedure.query(async () => {
      const [resources, oldNotes, oldFiles] = await Promise.all([listArchiveItems(), listJournalEntries(), listArchiveFiles()]);
      const modern = await Promise.all(resources.map(async (item) => ({
        id: `item-${item.id}`,
        resourceId: item.id,
        kind: item.kind,
        platform: item.platform,
        title: item.title,
        summary: item.summary,
        body: item.body,
        tags: item.tags,
        sourceUrl: item.sourceUrl,
        mimeType: item.mimeType,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileUrl: item.storageKey ? await storageGetSignedUrl(item.storageKey) : null,
        coverUrl: item.coverKey ? await storageGetSignedUrl(item.coverKey) : null,
        createdAt: item.updatedAt,
        legacy: false,
      })));
      const notes = oldNotes.map((note) => ({
        id: `legacy-note-${note.id}`,
        resourceId: null,
        kind: "note" as const,
        platform: null,
        title: note.title,
        summary: summaryFromBody(note.body),
        body: note.body,
        tags: "",
        sourceUrl: null,
        mimeType: null,
        fileName: null,
        fileSize: null,
        fileUrl: null,
        coverUrl: null,
        createdAt: note.updatedAt,
        legacy: true,
      }));
      const files = await Promise.all(oldFiles.map(async (file) => ({
        id: `legacy-file-${file.id}`,
        resourceId: null,
        kind: file.mimeType.startsWith("image/") ? "image" as const : "file" as const,
        platform: null,
        title: file.fileName,
        summary: `${file.mimeType} · ${file.fileSize.toLocaleString("ko-KR")} bytes`,
        body: null,
        tags: "",
        sourceUrl: null,
        mimeType: file.mimeType,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUrl: await storageGetSignedUrl(file.fileKey),
        coverUrl: null,
        createdAt: file.createdAt,
        legacy: true,
      })));
      return [...modern, ...notes, ...files].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),

    createVideo: archiveProcedure
      .input(z.object({
        sourceUrl: z.string().url().max(2048),
        title: z.string().trim().min(1).max(200),
        summary: z.string().trim().max(1000).default(""),
        tags: tagsSchema,
        coverFileName: z.string().max(255).optional(),
        coverMimeType: z.string().max(160).optional(),
        coverBase64: z.string().max(MAX_BASE64_LENGTH).optional(),
      }))
      .mutation(async ({ input }) => {
        const video = parseArchiveVideoUrl(input.sourceUrl);
        if (!video) throw new TRPCError({ code: "BAD_REQUEST", message: "공개 YouTube 또는 Instagram 영상 링크를 입력해 주세요." });
        let coverKey: string | null = null;
        if (input.coverBase64) {
          const { bytes, mimeType } = decodeArchiveUpload(input.coverBase64, input.coverMimeType, "image");
          const name = sanitizeArchiveFileName(input.coverFileName ?? "video-cover.webp");
          coverKey = (await storagePut(uploadKey(name), bytes, mimeType)).key;
        }
        await createArchiveItem({
          kind: "video", platform: video.platform, title: input.title, summary: input.summary,
          body: null, tags: input.tags, sourceUrl: video.canonicalUrl, fileName: null,
          mimeType: null, storageKey: null, coverKey, fileSize: null,
        });
        return { success: true } as const;
      }),

    createNote: archiveProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(200),
        summary: z.string().trim().max(1000).default(""),
        body: z.string().max(50_000).default(""),
        tags: tagsSchema,
      }))
      .mutation(async ({ input }) => {
        await createArchiveItem({
          kind: "note", platform: null, title: input.title,
          summary: input.summary || summaryFromBody(input.body), body: input.body,
          tags: input.tags, sourceUrl: null, fileName: null, mimeType: null,
          storageKey: null, coverKey: null, fileSize: null,
        });
        return { success: true } as const;
      }),

    upload: archiveProcedure
      .input(z.object({
        kind: z.enum(["image", "file"]),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(160).optional(),
        base64: z.string().min(1).max(MAX_BASE64_LENGTH),
        title: z.string().trim().max(200).optional(),
        summary: z.string().trim().max(1000).default(""),
        tags: tagsSchema,
      }))
      .mutation(async ({ input }) => {
        const { bytes, mimeType } = decodeArchiveUpload(input.base64, input.mimeType, input.kind === "image" ? "image" : "document");
        const safeName = sanitizeArchiveFileName(input.fileName);
        const storageKey = (await storagePut(uploadKey(safeName), bytes, mimeType)).key;
        await createArchiveItem({
          kind: input.kind, platform: null, title: input.title?.trim() || safeName.slice(0, 200),
          summary: input.summary, body: null, tags: input.tags, sourceUrl: null,
          fileName: safeName, mimeType, storageKey, coverKey: null, fileSize: bytes.byteLength,
        });
        return { success: true } as const;
      }),

    update: archiveProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(1).max(200),
        summary: z.string().trim().max(1000),
        tags: tagsSchema,
        body: z.string().max(50_000).nullable(),
      }))
      .mutation(async ({ input }) => {
        await updateArchiveItem(input.id, { title: input.title, summary: input.summary, tags: input.tags, body: input.body });
        return { success: true } as const;
      }),
  }),
});
