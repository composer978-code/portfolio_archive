import { describe, expect, it } from "vitest";
import { verifyArchiveCode } from "./archiveAuth";

describe("archive access code", () => {
  it("accepts only the configured code using the project secret", () => {
    const configuredCode = process.env.PORTFOLIO_ARCHIVE_CODE ?? "";
    expect(configuredCode.length).toBeGreaterThan(0);
    expect(verifyArchiveCode(configuredCode, configuredCode)).toBe(true);
    expect(verifyArchiveCode(`${configuredCode}x`, configuredCode)).toBe(false);
  });

  it("rejects empty or unconfigured values", () => {
    expect(verifyArchiveCode("", "secret-value")).toBe(false);
    expect(verifyArchiveCode("anything", "")).toBe(false);
  });
});
