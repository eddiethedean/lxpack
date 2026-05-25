import { describe, it, expect, vi } from "vitest";
import { Scorm2004Bridge } from "./scorm2004-bridge.js";
import type { Scorm2004Connection } from "../scorm2004-api.js";
import type { CourseProgress } from "../types.js";

const defaults: CourseProgress = {
  currentLessonId: "intro",
  completedLessons: [],
  assessmentScores: {},
  suspendData: {},
};

function mockConnection(values: Record<string, string>): Scorm2004Connection {
  return {
    Initialize: vi.fn(),
    GetValue: vi.fn((key: string) => values[key] ?? ""),
    SetValue: vi.fn(() => "true"),
    Commit: vi.fn(() => "true"),
    Terminate: vi.fn(() => "true"),
    setLocation: vi.fn(),
    setSuspendData: vi.fn(),
    setCompletionStatus: vi.fn(),
    setSuccessStatus: vi.fn(),
    setScoreScaled: vi.fn(),
  } as unknown as Scorm2004Connection;
}

describe("Scorm2004Bridge", () => {
  it("warns and uses cmi.location when suspend_data is corrupt", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bridge = new Scorm2004Bridge(
      mockConnection({
        "cmi.suspend_data": "{bad",
        "cmi.location": "wrap",
      }),
    );

    const restored = bridge.restoreProgress(defaults);
    expect(restored.currentLessonId).toBe("wrap");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("suspend_data could not be parsed"),
    );
    warn.mockRestore();
  });

  it("sets incomplete completion when assessments failed at max attempts", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.applyCompletion({
      ratio: 0.5,
      scorePercent: 50,
      allLessonsComplete: true,
      allAssessmentsPassed: false,
      anyAssessmentFailed: true,
      hasAssessments: true,
      completionThreshold: 0.8,
    });
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("failed");
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("incomplete");
    expect(conn.setCompletionStatus).not.toHaveBeenCalledWith("completed");
  });
});
