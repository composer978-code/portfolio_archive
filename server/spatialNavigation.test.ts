import { describe, expect, it } from "vitest";
import { moveFieldIndex, normalizeFieldIndex } from "../shared/spatial-navigation";

describe("Spatial OS field navigation", () => {
  it("wraps forward from the last field to the first", () => {
    expect(moveFieldIndex(3, 1, 4)).toBe(0);
  });

  it("wraps backward from the first field to the last", () => {
    expect(moveFieldIndex(0, -1, 4)).toBe(3);
  });

  it("normalizes indexes outside the field list", () => {
    expect(normalizeFieldIndex(6, 4)).toBe(2);
    expect(normalizeFieldIndex(-2, 4)).toBe(2);
  });

  it("safely handles an empty field list", () => {
    expect(moveFieldIndex(2, 1, 0)).toBe(0);
  });
});
