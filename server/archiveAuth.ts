import { createHash, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { parse } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";

export const ARCHIVE_COOKIE = "portfolio_archive_session";
export const ARCHIVE_SESSION_HEADER = "x-portfolio-archive-session";
const SESSION_ISSUER = "personal-portfolio-archive";
const SESSION_AUDIENCE = "private-archive";
const SESSION_DURATION = "12h";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time comparison; the configured code stays server-side in project secrets. */
export function verifyArchiveCode(candidate: string, configuredCode = ENV.archiveAccessCode): boolean {
  if (!candidate || !configuredCode) return false;
  return timingSafeEqual(digest(candidate), digest(configuredCode));
}

function sessionKey() {
  if (!ENV.cookieSecret) throw new Error("Session signing secret is not configured");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createArchiveSession() {
  if (!ENV.archiveAccessCode) throw new Error("Archive access code is not configured");
  return new SignJWT({ scope: "private-archive", codeVersion: digest(ENV.archiveAccessCode).toString("hex") })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject("archive-owner")
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(sessionKey());
}

function getSessionCandidates(req: Request) {
  const cookieToken = parse(req.headers.cookie ?? "")[ARCHIVE_COOKIE];
  const headerValue = req.headers[ARCHIVE_SESSION_HEADER];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return [cookieToken, headerToken?.trim()].filter((token): token is string => Boolean(token));
}

/** Accept the HTTP-only cookie first, with a per-tab signed token fallback for embedded previews that block cookies. */
export async function hasArchiveSession(req: Request): Promise<boolean> {
  if (!ENV.cookieSecret || !ENV.archiveAccessCode) return false;
  const candidates = getSessionCandidates(req);
  if (candidates.length === 0) return false;

  const currentCodeVersion = digest(ENV.archiveAccessCode).toString("hex");
  for (const token of candidates) {
    try {
      const { payload } = await jwtVerify(token, sessionKey(), {
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });
      if (
        payload.sub === "archive-owner" &&
        payload.scope === "private-archive" &&
        payload.codeVersion === currentCodeVersion
      ) {
        return true;
      }
    } catch {
      // A stale cookie can coexist with a current per-tab fallback token; try the next candidate.
    }
  }
  return false;
}

export const archiveProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!(await hasArchiveSession(ctx.req))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "아카이브 잠금을 먼저 해제해 주세요." });
  }
  return next();
});
