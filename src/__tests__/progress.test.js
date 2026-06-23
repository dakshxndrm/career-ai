import { describe, it, expect } from "vitest";

function computeProgress(completed, total) {
  if (!total) return 0;
  return Math.round((Object.values(completed).filter(Boolean).length / total) * 100);
}

function computeCompletedCount(completed) {
  return Object.values(completed).filter(Boolean).length;
}

describe("computeProgress", () => {
  it("returns 0 for empty completed map", () => {
    expect(computeProgress({}, 5)).toBe(0);
  });

  it("returns 0 when total is 0", () => {
    expect(computeProgress({ s1: true }, 0)).toBe(0);
  });

  it("returns 100 when all items are completed", () => {
    expect(computeProgress({ s1: true, s2: true, s3: true }, 3)).toBe(100);
  });

  it("rounds correctly for non-integer percentages", () => {
    // 2/3 = 66.666... → 67
    expect(computeProgress({ s1: true, s2: true, s3: false }, 3)).toBe(67);
  });

  it("counts only truthy values as complete", () => {
    expect(computeProgress({ s1: true, s2: false, s3: true }, 5)).toBe(40);
  });
});

describe("computeCompletedCount", () => {
  it("returns 0 for empty map", () => {
    expect(computeCompletedCount({})).toBe(0);
  });

  it("ignores false values", () => {
    expect(computeCompletedCount({ a: true, b: false, c: true })).toBe(2);
  });

  it("returns total when all true", () => {
    expect(computeCompletedCount({ x: true, y: true })).toBe(2);
  });
});
