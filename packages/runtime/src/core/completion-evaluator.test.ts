import { describe, it, expect } from "vitest";
import {
  buildCompletionState,
  resolveScormActivityScope,
} from "./completion-evaluator.js";
import type { CourseProgress } from "../types.js";
import type { CourseManifest } from "@lxpack/validators";

const manifest: CourseManifest = {
  title: "Test",
  version: "1.0.0",
  tracking: { completion: { threshold: 0.8 } },
  lessons: [
    { id: "intro", type: "markdown", file: "intro.md" },
    { id: "lab", type: "html", path: "interactions/lab" },
  ],
  assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
};

const baseProgress: CourseProgress = {
  currentLessonId: "intro",
  completedLessons: [],
  assessmentScores: {},
  suspendData: {},
};

function evaluate(
  progress: CourseProgress,
  passed: Set<string>,
  scopeActivity?: { id: string; kind: "lesson" | "assessment" },
) {
  return buildCompletionState(progress, {
    manifest,
    completionThreshold: 0.8,
    assessmentConfigs: { quiz: { maxAttempts: 2, shuffleChoices: false, showFeedback: true } },
    defaultPassingScores: { quiz: 0.7 },
    passedAssessments: passed,
    scopeActivity,
  });
}

describe("buildCompletionState", () => {
  it("requires all lessons and assessments for full course", () => {
    const state = evaluate(
      { ...baseProgress, completedLessons: ["intro", "lab"] },
      new Set(),
    );
    expect(state.allLessonsComplete).toBe(true);
    expect(state.allAssessmentsPassed).toBe(false);
    expect(state.ratio).toBeCloseTo(2 / 3);
  });

  it("marks anyAssessmentFailed at max attempts", () => {
    const progress: CourseProgress = {
      ...baseProgress,
      assessmentScores: { quiz: 0.2 },
      suspendData: { assessment_attempts_quiz: 2 },
    };
    const state = evaluate(progress, new Set());
    expect(state.anyAssessmentFailed).toBe(true);
  });

  it("scopes lesson SCO to a single lesson", () => {
    const state = evaluate(
      { ...baseProgress, completedLessons: ["intro"] },
      new Set(),
      { id: "intro", kind: "lesson" },
    );
    expect(state.ratio).toBe(1);
    expect(state.allLessonsComplete).toBe(true);
    expect(state.allAssessmentsPassed).toBe(true);
  });

  it("scopes assessment SCO to one quiz", () => {
    const state = evaluate(
      { ...baseProgress, assessmentScores: { quiz: 0.9 } },
      new Set(["quiz"]),
      { id: "quiz", kind: "assessment" },
    );
    expect(state.ratio).toBe(1);
    expect(state.allAssessmentsPassed).toBe(true);
    expect(state.allLessonsComplete).toBe(true);
  });
});

describe("resolveScormActivityScope", () => {
  it("resolves lesson and assessment ids", () => {
    expect(resolveScormActivityScope(manifest, "lab")).toEqual({
      id: "lab",
      kind: "lesson",
    });
    expect(resolveScormActivityScope(manifest, "quiz")).toEqual({
      id: "quiz",
      kind: "assessment",
    });
    expect(resolveScormActivityScope(manifest, "missing")).toBeUndefined();
  });
});
