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

function mockConnection(values: Record<string, string>): ScormConnection {
  return {
    LMSInitialize: vi.fn(),
    LMSGetValue: vi.fn((key: string) => values[key] ?? ""),
    LMSSetValue: vi.fn(() => "true"),
    LMSCommit: vi.fn(() => "true"),
    LMSFinish: vi.fn(() => "true"),
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

    const restored = bridge.restoreProgress(defaults);
    expect(restored.currentLessonId).toBe("lab");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("suspend_data could not be parsed"),
    );
    warn.mockRestore();
  });
});
