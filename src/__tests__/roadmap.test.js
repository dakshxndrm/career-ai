import { describe, it, expect } from "vitest";
import { computeStreak, computeWeekCount } from "../utils/roadmapUtils.js";

describe("computeStreak", () => {
  it("returns 0 for empty array", () => {
    expect(computeStreak([], "2025-06-23")).toBe(0);
  });

  it("returns 1 when only today is present", () => {
    expect(computeStreak(["2025-06-23"], "2025-06-23")).toBe(1);
  });

  it("returns 1 when only yesterday is present", () => {
    expect(computeStreak(["2025-06-22"], "2025-06-23")).toBe(1);
  });

  it("returns 0 when most recent day is older than yesterday", () => {
    expect(computeStreak(["2025-06-20"], "2025-06-23")).toBe(0);
  });

  it("returns correct streak for consecutive days ending today", () => {
    const days = ["2025-06-21", "2025-06-22", "2025-06-23"];
    expect(computeStreak(days, "2025-06-23")).toBe(3);
  });

  it("stops at first gap", () => {
    const days = ["2025-06-20", "2025-06-22", "2025-06-23"];
    expect(computeStreak(days, "2025-06-23")).toBe(2);
  });

  it("deduplicates repeated days", () => {
    const days = ["2025-06-22", "2025-06-22", "2025-06-23", "2025-06-23"];
    expect(computeStreak(days, "2025-06-23")).toBe(2);
  });

  it("counts consecutive days ending yesterday", () => {
    const days = ["2025-06-21", "2025-06-22"];
    expect(computeStreak(days, "2025-06-23")).toBe(2);
  });
});

describe("computeWeekCount", () => {
  it("returns 0 for empty array", () => {
    expect(computeWeekCount([], "2025-06-23")).toBe(0);
  });

  it("counts only days within the last 7 days (inclusive)", () => {
    const days = ["2025-06-16", "2025-06-17", "2025-06-20", "2025-06-23"];
    // weekAgo = 2025-06-16, so all 4 are included
    expect(computeWeekCount(days, "2025-06-23")).toBe(4);
  });

  it("excludes days before weekAgo", () => {
    const days = ["2025-06-01", "2025-06-10", "2025-06-20", "2025-06-23"];
    // weekAgo = 2025-06-16; only 2025-06-20 and 2025-06-23 qualify
    expect(computeWeekCount(days, "2025-06-23")).toBe(2);
  });

  it("returns 1 for only today", () => {
    expect(computeWeekCount(["2025-06-23"], "2025-06-23")).toBe(1);
  });
});
