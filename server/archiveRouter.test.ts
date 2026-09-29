import { describe, expect, it } from "vitest";
import { ARCHIVE_COOKIE, ARCHIVE_SESSION_HEADER } from "./archiveAuth";
import { archiveRouter } from "./archiveRouter";
import type { TrpcContext } from "./_core/context";

type CookieWrite = { name: string; value: string; options: Record<string, unknown> };

function createTestCaller(ip: string, protocol: "http" | "https" = "https") {
  const cookieWrites: CookieWrite[] = [];
  const req = {
    protocol,
    headers: { "x-forwarded-proto": protocol } as Record<string, string>,
    ip,
  } as unknown as TrpcContext["req"];
  const res = {
    cookie: (name: string, value: string, options: Record<string, unknown>) => {
      cookieWrites.push({ name, value, options });
    },
    clearCookie: () => undefined,
  } as unknown as TrpcContext["res"];
  return { caller: archiveRouter.createCaller({ req, res, user: null }), req, cookieWrites };
}

const configuredCode = () => process.env.PORTFOLIO_ARCHIVE_CODE ?? "";

describe("archive access API", () => {
  it("returns a session fallback and unlocks without relying on a cookie", async () => {
    const code = configuredCode();
    expect(code.length).toBeGreaterThan(0);
    const { caller, req, cookieWrites } = createTestCaller("archive-auth-test");
    const result = await caller.unlock({ code });

    expect(result.success).toBe(true);
    expect(result.sessionToken).toEqual(expect.any(String));
    expect(result.sessionToken).not.toBe(code);
    expect(cookieWrites).toHaveLength(1);
    expect(cookieWrites[0]?.name).toBe(ARCHIVE_COOKIE);
    expect(cookieWrites[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none" });

    req.headers[ARCHIVE_SESSION_HEADER] = result.sessionToken;
    expect(await caller.status()).toEqual({ unlocked: true, configured: true });
  });

  it("keeps the cookie compatible with local HTTP development", async () => {
    const code = configuredCode();
    expect(code.length).toBeGreaterThan(0);
    const { caller, cookieWrites } = createTestCaller("archive-auth-local-test", "http");
    await caller.unlock({ code });
    expect(cookieWrites[0]?.options).toMatchObject({ secure: false, sameSite: "lax" });
  });

  it("accepts the regular HTTP-only cookie session", async () => {
    const code = configuredCode();
    expect(code.length).toBeGreaterThan(0);
    const { caller, req, cookieWrites } = createTestCaller("archive-auth-cookie-test");
    await caller.unlock({ code });
    req.headers.cookie = `${ARCHIVE_COOKIE}=${cookieWrites[0]!.value}`;
    expect(await caller.status()).toEqual({ unlocked: true, configured: true });
  });

  it("rejects an incorrect code without issuing a session", async () => {
    const code = configuredCode();
    expect(code.length).toBeGreaterThan(0);
    const { caller, cookieWrites } = createTestCaller("archive-auth-test-wrong");
    await expect(caller.unlock({ code: `${code}-wrong` })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(cookieWrites).toHaveLength(0);
  });

  it("blocks private library reads before the code unlocks the archive", async () => {
    const { caller } = createTestCaller("archive-auth-test-locked");
    await expect(caller.items.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("validates legacy uploads before any storage write", async () => {
    const code = configuredCode();
    expect(code.length).toBeGreaterThan(0);
    const { caller, req } = createTestCaller("archive-legacy-upload-test");
    const session = await caller.unlock({ code });
    req.headers[ARCHIVE_SESSION_HEADER] = session.sessionToken;

    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>").toString("base64");
    await expect(caller.files.upload({ fileName: "image.svg", mimeType: "image/svg+xml", base64: svg }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });

    const oversized = Buffer.alloc(8 * 1024 * 1024 + 1, 0x61).toString("base64");
    await expect(caller.files.upload({ fileName: "too-large.txt", mimeType: "text/plain", base64: oversized }))
      .rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });
});
