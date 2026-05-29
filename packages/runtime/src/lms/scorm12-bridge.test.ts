import { describe, it, expect, vi } from "vitest";
import { Scorm12Bridge } from "./scorm12-bridge.js";
import type { ScormConnection } from "../scorm-api.js";
import type { CourseProgress } from "../types.js";

const defaults: CourseProgress = {
  currentLessonId: "intro",
  completedLessons: [],
  assessmentScores: {},
  suspendData: {},
};

function mockConnection(
  values: Record<string, string>,
  options: {
    initResult?: string;
    commitResult?: string;
    finishResult?: string;
  } = {},
): ScormConnection {
  const {
    initResult = "true",
    commitResult = "true",
    finishResult = "true",
  } = options;
  return {
    LMSInitialize: vi.fn(() => initResult),
    LMSGetValue: vi.fn((key: string) => values[key] ?? ""),
    LMSSetValue: vi.fn(() => "true"),
    LMSCommit: vi.fn(() => commitResult),
    LMSFinish: vi.fn(() => finishResult),
    setLessonLocation: vi.fn(),
    setSuspendData: vi.fn(),
    setScore: vi.fn(),
    setLessonStatus: vi.fn(),
  } as unknown as ScormConnection;
}

describe("Scorm12Bridge", () => {
  it("warns and uses lesson_location when suspend_data is corrupt", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bridge = new Scorm12Bridge(
      mockConnection({
        "cmi.suspend_data": "{not valid json",
        "cmi.core.lesson_location": "lab",
      }),
    );
    bridge.init();

    const restored = bridge.restoreProgress(defaults);
    expect(restored.currentLessonId).toBe("lab");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("suspend_data could not be parsed"),
    );
    warn.mockRestore();
  });

  it("skips LMS reads and writes when Initialize fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const connection = mockConnection({}, { initResult: "false" });
    const bridge = new Scorm12Bridge(connection);
    bridge.init();

    expect(bridge.restoreProgress(defaults)).toEqual(defaults);
    bridge.persist(defaults, "{}");
    bridge.setLocation("intro");
    bridge.applyCompletion({
      ratio: 1,
      scorePercent: 100,
      completionThreshold: 0.8,
      allLessonsComplete: true,
      allAssessmentsPassed: true,
      anyAssessmentFailed: false,
      hasAssessments: false,
      hasLearnerProgress: true,
    });
    bridge.terminate();

    expect(connection.LMSGetValue).not.toHaveBeenCalled();
    expect(connection.setSuspendData).not.toHaveBeenCalled();
    expect(connection.setLessonLocation).not.toHaveBeenCalled();
    expect(connection.setScore).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns when LMSCommit fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const connection = mockConnection({}, { commitResult: "false" });
    const bridge = new Scorm12Bridge(connection);
    bridge.init();
    bridge.persist(defaults, "{}");
    expect(connection.setSuspendData).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[lxpack] SCORM 1.2 LMSCommit failed");
    warn.mockRestore();
  });

  it("warns when LMSFinish fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const connection = mockConnection({}, { finishResult: "false" });
    const bridge = new Scorm12Bridge(connection);
    bridge.init();
    bridge.terminate();
    expect(warn).toHaveBeenCalledWith("[lxpack] SCORM 1.2 LMSFinish failed");
    warn.mockRestore();
  });
});
