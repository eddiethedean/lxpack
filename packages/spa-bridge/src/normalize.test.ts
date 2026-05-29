import { describe, expect, it } from "vitest";
import {
  DEFAULT_BRIDGE_PASSING_SCORE,
  normalizePassingThreshold,
  normalizeScore,
} from "./normalize.js";

describe("normalizeScore", () => {
  it("returns clamped 0–1 when already scaled", () => {
    expect(normalizeScore({ score: 0.85 })).toBe(0.85);
  });

  it("scales by maxScore", () => {
    expect(normalizeScore({ score: 8, maxScore: 10 })).toBe(0.8);
  });

  it("treats 0–100 as percent when > 1", () => {
    expect(normalizeScore({ score: 80 })).toBe(0.8);
  });

  it("returns null for non-finite", () => {
    expect(normalizeScore({ score: Number.NaN })).toBeNull();
  });
});

describe("normalizePassingThreshold", () => {
  it("defaults when missing", () => {
    expect(normalizePassingThreshold({})).toBe(DEFAULT_BRIDGE_PASSING_SCORE);
  });

  it("scales with maxScore", () => {
    expect(
      normalizePassingThreshold({ passingScore: 7, maxScore: 10 }),
    ).toBe(0.7);
  });

  it("treats percent-style passing scores", () => {
    expect(normalizePassingThreshold({ passingScore: 80 })).toBe(0.8);
  });
});
