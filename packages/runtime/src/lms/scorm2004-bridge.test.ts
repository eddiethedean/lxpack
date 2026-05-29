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

function mockConnection(
  values: Record<string, string>,
  options: {
    initResult?: string;
    commitResult?: string;
    terminateResult?: string;
  } = {},
): Scorm2004Connection {
  const {
    initResult = "true",
    commitResult = "true",
    terminateResult = "true",
  } = options;
  return {
    Initialize: vi.fn(() => initResult),
    GetValue: vi.fn((key: string) => values[key] ?? ""),
    SetValue: vi.fn(() => "true"),
    Commit: vi.fn(() => commitResult),
    Terminate: vi.fn(() => terminateResult),
    setLocation: vi.fn(),
    setSuspendData: vi.fn(),
    setCompletionStatus: vi.fn(),
    setSuccessStatus: vi.fn(),
    setScoreScaled: vi.fn(),
  } as unknown as Scorm2004Connection;
}

const passedState = {
  ratio: 1,
  scorePercent: 100,
  allLessonsComplete: true,
  allAssessmentsPassed: true,
  anyAssessmentFailed: false,
  hasAssessments: true,
  hasLearnerProgress: true,
  completionThreshold: 0.8,
};

describe("Scorm2004Bridge", () => {
  it("warns and uses cmi.location when suspend_data is corrupt", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bridge = new Scorm2004Bridge(
      mockConnection({
        "cmi.suspend_data": "{bad",
        "cmi.location": "wrap",
      }),
    );
    bridge.init();

    const restored = bridge.restoreProgress(defaults);
    expect(restored.currentLessonId).toBe("wrap");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("suspend_data could not be parsed"),
    );
    warn.mockRestore();
  });

  it("sets incomplete when scoped lesson has zero progress", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.applyCompletion({
      ratio: 0,
      scorePercent: 0,
      allLessonsComplete: false,
      allAssessmentsPassed: false,
      anyAssessmentFailed: false,
      hasAssessments: false,
      hasLearnerProgress: false,
      completionThreshold: 0.8,
    });
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("incomplete");
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("unknown");
  });

  it("sets incomplete completion when assessments failed at max attempts", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.applyCompletion({
      ratio: 0.5,
      scorePercent: 50,
      allLessonsComplete: true,
      allAssessmentsPassed: false,
      anyAssessmentFailed: true,
      hasAssessments: true,
      hasLearnerProgress: true,
      completionThreshold: 0.8,
    });
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("failed");
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("incomplete");
    expect(conn.setCompletionStatus).not.toHaveBeenCalledWith("completed");
  });

  it("skips LMS reads and writes when Initialize fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const connection = mockConnection({}, { initResult: "false" });
    const bridge = new Scorm2004Bridge(connection);
    bridge.init();

    expect(bridge.restoreProgress(defaults)).toEqual(defaults);
    bridge.persist(defaults, "{}");
    bridge.setLocation("intro");
    bridge.applyCompletion(passedState);
    bridge.terminate();

    expect(connection.GetValue).not.toHaveBeenCalled();
    expect(connection.setSuspendData).not.toHaveBeenCalled();
    expect(connection.setLocation).not.toHaveBeenCalled();
    expect(connection.setScoreScaled).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("restores progress from valid suspend_data", () => {
    const saved = JSON.stringify({
      currentLessonId: "b",
      completedLessons: ["a"],
      assessmentScores: {},
      suspendData: {},
    });
    const bridge = new Scorm2004Bridge(
      mockConnection({ "cmi.suspend_data": saved }),
    );
    bridge.init();
    const restored = bridge.restoreProgress(defaults);
    expect(restored.currentLessonId).toBe("b");
    expect(restored.completedLessons).toEqual(["a"]);
  });

  it("restores current lesson from cmi.location when suspend_data is empty", () => {
    const bridge = new Scorm2004Bridge(
      mockConnection({ "cmi.location": "lab" }),
    );
    bridge.init();
    expect(bridge.restoreProgress(defaults).currentLessonId).toBe("lab");
  });

  it("marks course passed when completion requirements are met", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.applyCompletion(passedState);
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("passed");
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("completed");
  });

  it("marks incomplete when learner has partial progress", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.applyCompletion({
      ratio: 0.3,
      scorePercent: 30,
      allLessonsComplete: false,
      allAssessmentsPassed: false,
      anyAssessmentFailed: false,
      hasAssessments: false,
      hasLearnerProgress: false,
      completionThreshold: 0.8,
    });
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("incomplete");
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("unknown");
  });

  it("marks incomplete when assessments are pending", () => {
    const conn = mockConnection({});
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.applyCompletion({
      ratio: 0,
      scorePercent: 0,
      allLessonsComplete: true,
      allAssessmentsPassed: false,
      anyAssessmentFailed: false,
      hasAssessments: true,
      hasLearnerProgress: true,
      completionThreshold: 0.8,
    });
    expect(conn.setCompletionStatus).toHaveBeenCalledWith("incomplete");
    expect(conn.setSuccessStatus).toHaveBeenCalledWith("unknown");
  });

  it("warns when Commit fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const conn = mockConnection({}, { commitResult: "false" });
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.persist(defaults, '{"c":"intro"}');
    expect(conn.setSuspendData).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[lxpack] SCORM 2004 Commit failed");
    warn.mockRestore();
  });

  it("warns when Terminate fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const conn = mockConnection({}, { terminateResult: "false" });
    const bridge = new Scorm2004Bridge(conn);
    bridge.init();
    bridge.terminate();
    expect(warn).toHaveBeenCalledWith("[lxpack] SCORM 2004 Terminate failed");
    warn.mockRestore();
  });
});
