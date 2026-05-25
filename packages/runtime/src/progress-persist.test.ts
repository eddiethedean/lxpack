import { describe, it, expect, vi } from "vitest";
import {
  compactProgress,
  expandProgress,
  expandLegacyProgress,
  parseStoredProgress,
  serializeProgressForStorage,
} from "./progress-persist.js";
import type { CourseProgress } from "./types.js";

const defaults: CourseProgress = {
  currentLessonId: "a",
  completedLessons: [],
  assessmentScores: {},
  suspendData: {},
};

describe("progress-persist", () => {
  it("round-trips compact progress", () => {
    const progress: CourseProgress = {
      currentLessonId: "b",
      completedLessons: ["a"],
      assessmentScores: { quiz: 0.9 },
      suspendData: { foo: "bar" },
    };
    const raw = serializeProgressForStorage(progress);
    const { progress: restored, parsed } = parseStoredProgress(raw, defaults);
    expect(parsed).toBe(true);
    expect(restored.currentLessonId).toBe("b");
    expect(restored.completedLessons).toEqual(["a"]);
  });

  it("supports legacy full progress payloads", () => {
    const raw = JSON.stringify({
      currentLessonId: "b",
      completedLessons: ["a"],
      assessmentScores: {},
      suspendData: {},
    });
    const { progress, parsed } = parseStoredProgress(raw, defaults);
    expect(parsed).toBe(true);
    expect(progress.currentLessonId).toBe("b");
  });

  it("returns parsed false for corrupt JSON", () => {
    const { parsed } = parseStoredProgress("{bad", defaults);
    expect(parsed).toBe(false);
  });

  it("returns parsed false for non-object JSON values", () => {
    const { parsed } = parseStoredProgress("null", defaults);
    expect(parsed).toBe(false);
  });

  it("parses legacy payloads with only assessmentScores", () => {
    const { progress, parsed } = parseStoredProgress(
      JSON.stringify({ assessmentScores: { quiz: 0.5 } }),
      defaults,
    );
    expect(parsed).toBe(true);
    expect(progress.assessmentScores.quiz).toBe(0.5);
  });

  it("parses compact suspend-only payloads", () => {
    const { progress, parsed } = parseStoredProgress(
      JSON.stringify({ s: { note: true } }),
      defaults,
    );
    expect(parsed).toBe(true);
    expect(progress.suspendData.note).toBe(true);
  });

  it("parses compact-only payloads", () => {
    const { progress, parsed } = parseStoredProgress(
      JSON.stringify({ c: "b", a: { quiz: 1 } }),
      defaults,
    );
    expect(parsed).toBe(true);
    expect(progress.currentLessonId).toBe("b");
    expect(progress.assessmentScores.quiz).toBe(1);
  });

  it("expandLegacyProgress ignores invalid suspendData", () => {
    const expanded = expandLegacyProgress(
      { suspendData: "bad" as unknown as Record<string, unknown> },
      defaults,
    );
    expect(expanded.suspendData).toEqual({});
  });

  it("compactProgress omits empty collections", () => {
    const compact = compactProgress(defaults);
    expect(compact.l).toBeUndefined();
    expect(compact.a).toBeUndefined();
  });

  it("expandLegacyProgress fills missing fields", () => {
    const expanded = expandLegacyProgress({ currentLessonId: "b" }, defaults);
    expect(expanded.completedLessons).toEqual([]);
  });

  it("expandProgress uses defaults for missing compact fields", () => {
    const expanded = expandProgress({}, defaults);
    expect(expanded).toEqual(defaults);
  });

  it("expandProgress reads compact keys", () => {
    const expanded = expandProgress({ c: "b", l: ["a"] }, defaults);
    expect(expanded.currentLessonId).toBe("b");
    expect(expanded.completedLessons).toEqual(["a"]);
  });

  it("expandProgress ignores invalid compact field types", () => {
    const expanded = expandProgress(
      { c: "b", l: "not-array" as unknown as string[], a: "bad" as unknown as Record<string, number> },
      defaults,
    );
    expect(expanded.completedLessons).toEqual([]);
    expect(expanded.assessmentScores).toEqual({});
  });

  it("preserves assessment attempt keys when pruning oversized suspend data", () => {
    const suspendData: Record<string, unknown> = {
      assessment_attempts_quiz: 2,
      assessment_passing_quiz: 0.7,
      filler: "x".repeat(5000),
    };
    for (let i = 0; i < 80; i++) {
      suspendData[`interaction_${i}`] = "y".repeat(60);
    }
    const progress: CourseProgress = {
      currentLessonId: "a",
      completedLessons: [],
      assessmentScores: {},
      suspendData,
    };
    const serialized = serializeProgressForStorage(progress);
    expect(serialized.length).toBeLessThanOrEqual(4096);
    const { progress: restored } = parseStoredProgress(serialized, defaults);
    expect(restored.suspendData.assessment_attempts_quiz).toBe(2);
    expect(restored.suspendData.assessment_passing_quiz).toBe(0.7);
  });

  it("prunes interaction keys when payload exceeds SCORM limit", () => {
    const suspendData: Record<string, unknown> = {};
    for (let i = 0; i < 120; i++) {
      suspendData[`interaction_${i}`] = "x".repeat(80);
    }
    const progress: CourseProgress = {
      currentLessonId: "a",
      completedLessons: ["a"],
      assessmentScores: { quiz: 1 },
      suspendData,
    };
    const serialized = serializeProgressForStorage(progress);
    expect(serialized.length).toBeLessThanOrEqual(4096);
    expect(serialized).not.toContain("interaction_0");
  });

  it("preserves assessment attempt keys in minimal snapshot when scores exist", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const progress: CourseProgress = {
      currentLessonId: "a",
      completedLessons: Array.from({ length: 80 }, (_, i) => `lesson-${i}`),
      assessmentScores: { quiz: 0.9 },
      suspendData: {
        assessment_attempts_quiz: 3,
        assessment_passing_quiz: 0.7,
        blob: "x".repeat(8000),
      },
    };
    const serialized = serializeProgressForStorage(progress, 256);
    const { progress: restored } = parseStoredProgress(serialized, defaults);
    expect(restored.assessmentScores.quiz).toBe(0.9);
    expect(restored.suspendData.assessment_attempts_quiz).toBe(3);
    warn.mockRestore();
  });

  it("emits parseable minimal progress when pruning is insufficient", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const suspendData: Record<string, unknown> = {
      blob: "y".repeat(5000),
      ...Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [`extra_${i}`, "z".repeat(120)]),
      ),
    };
    const progress: CourseProgress = {
      currentLessonId: "a",
      completedLessons: Array.from({ length: 120 }, (_, i) => `lesson-${i}`),
      assessmentScores: Object.fromEntries(
        Array.from({ length: 120 }, (_, i) => [`assessment-${i}`, 0.5]),
      ),
      suspendData,
    };
    const serialized = serializeProgressForStorage(progress, 512);
    expect(serialized.length).toBeLessThanOrEqual(512);
    expect(() => JSON.parse(serialized)).not.toThrow();
    const { progress: restored, parsed } = parseStoredProgress(serialized, {
      currentLessonId: "fallback",
      completedLessons: [],
      assessmentScores: {},
      suspendData: {},
    });
    expect(parsed).toBe(true);
    expect(restored.currentLessonId).toBe("a");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
