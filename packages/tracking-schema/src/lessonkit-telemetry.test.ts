import { describe, expect, it } from "vitest";
import {
  mapLessonkitTelemetryToBridgeAction,
  mapLessonkitTelemetryToLxpack,
} from "./lessonkit-telemetry.js";

describe("mapLessonkitTelemetryToLxpack", () => {
  it("maps interaction events", () => {
    expect(
      mapLessonkitTelemetryToLxpack({
        name: "interaction",
        lessonId: "lab",
        data: { ok: true },
      }),
    ).toEqual({
      type: "interaction",
      id: "lab",
      data: { ok: true },
    });
  });

  it("returns null for lifecycle events", () => {
    expect(
      mapLessonkitTelemetryToLxpack({ name: "lesson_completed", lessonId: "a" }),
    ).toBeNull();
  });
});

describe("mapLessonkitTelemetryToBridgeAction", () => {
  it("maps course_completed to completeCourse", () => {
    expect(
      mapLessonkitTelemetryToBridgeAction({ name: "course_completed" }),
    ).toEqual({ kind: "completeCourse" });
  });

  it("maps lesson_completed to completeLesson", () => {
    expect(
      mapLessonkitTelemetryToBridgeAction({
        name: "lesson_completed",
        lessonId: "spa1",
      }),
    ).toEqual({ kind: "completeLesson", lessonId: "spa1" });
  });

  it("maps quiz_completed to submitAssessment", () => {
    expect(
      mapLessonkitTelemetryToBridgeAction({
        name: "quiz_completed",
        assessmentId: "final",
        score: 1,
        passingScore: 0.7,
      }),
    ).toEqual({
      kind: "submitAssessment",
      id: "final",
      score: 1,
      passingScore: 0.7,
      maxScore: undefined,
    });
  });
});
