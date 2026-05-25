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
    setCompletion: vi.fn(),
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
});
