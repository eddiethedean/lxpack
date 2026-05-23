import { beforeEach, describe, it, expect, vi } from "vitest";
import { LxpackRuntime } from "./runtime.js";

const manifest = {
  title: "Test",
  version: "1.0.0",
  tracking: { completion: { threshold: 0.5 } },
  lessons: [
    { id: "a", type: "markdown" as const, file: "a.md" },
    { id: "b", type: "markdown" as const, file: "b.md" },
  ],
};

describe("LxpackRuntime", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it("starts at first lesson with empty progress in preview mode", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: "/course",
      mode: "preview",
    });

    expect(runtime.getProgress().currentLessonId).toBe("a");
    expect(runtime.getProgress().completedLessons).toEqual([]);
    expect(runtime.getCompletionRatio()).toBe(0);
    expect(runtime.getManifest().title).toBe("Test");
  });

  it("returns zero completion ratio when there are no lessons", () => {
    const runtime = new LxpackRuntime({
      manifest: { title: "Empty", version: "1.0.0", lessons: [] },
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.getCompletionRatio()).toBe(0);
  });

  it("restores progress from config", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
      progress: {
        currentLessonId: "b",
        completedLessons: ["a"],
        assessmentScores: {},
        suspendData: { foo: "bar" },
      },
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.isLessonComplete("a")).toBe(true);
    expect(runtime.getCompletionRatio()).toBe(0.5);
  });

  it("completes lessons idempotently via API", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    const api = runtime.getAPI();

    api.completeLesson("a");
    api.completeLesson("a");
    expect(runtime.getProgress().completedLessons).toEqual(["a"]);

    api.completeLesson("b");
    expect(runtime.getCompletionRatio()).toBe(1);
  });

  it("tracks events without interaction id", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.getAPI().track({ type: "custom" });
    expect(runtime.getProgress()).toBeDefined();
  });

  it("logs interaction events with ids", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.getAPI().track({ type: "interaction", id: "click-1", data: { x: 1 } });
    expect(console.debug).toHaveBeenCalled();
  });

  it("updates SCORM lesson location when changing lessons", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    runtime.setCurrentLesson("b");
    expect(window.API!.LMSGetValue("cmi.core.lesson_location")).toBe("b");
  });

  it("stores variables in suspendData", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    const api = runtime.getAPI();

    api.setVariable("score", 10);
    expect(api.getVariable("score")).toBe(10);
    expect(runtime.getProgress().suspendData.score).toBe(10);
  });

  it("updates current lesson location", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.setCurrentLesson("b");
    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("marks SCORM completed when threshold is met", () => {
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        tracking: { completion: { threshold: 0.6 } },
      },
      baseUrl: ".",
      mode: "scorm12",
    });

    runtime.completeLesson("a");
    const api = window.API!;
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("incomplete");
    expect(api.LMSGetValue("cmi.core.score.raw")).toBe("50");

    runtime.completeLesson("b");
    expect(api.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
    expect(api.LMSGetValue("cmi.core.score.raw")).toBe("100");
  });

  it("ignores corrupt suspend_data in scorm12 mode", () => {
    localStorage.setItem(
      "lxpack_scorm12",
      JSON.stringify({
        lessonStatus: "incomplete",
        scoreRaw: 0,
        scoreMin: 0,
        scoreMax: 100,
        suspendData: "not-json",
        lessonLocation: "",
      }),
    );

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });

    expect(runtime.getProgress().currentLessonId).toBe("a");
  });

  it("restores valid suspend_data in scorm12 mode", () => {
    localStorage.setItem(
      "lxpack_scorm12",
      JSON.stringify({
        lessonStatus: "incomplete",
        scoreRaw: 0,
        scoreMin: 0,
        scoreMax: 100,
        suspendData: JSON.stringify({
          currentLessonId: "b",
          completedLessons: ["a"],
          assessmentScores: {},
          suspendData: {},
        }),
        lessonLocation: "",
      }),
    );

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.isLessonComplete("a")).toBe(true);
  });

  it("terminates SCORM session", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    const api = window.API!;
    runtime.terminate();
    expect(api.LMSFinish()).toBe("false");
  });

  it("swallows localStorage errors when persisting progress", () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (key === "lxpack_progress") throw new Error("quota");
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => store.clear(),
        get length() {
          return store.size;
        },
        key: (index: number) => [...store.keys()][index] ?? null,
      },
      configurable: true,
    });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(() => runtime.getAPI().track({ type: "x" })).not.toThrow();
  });

  it("swallows localStorage errors when persisting in scorm mode", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    expect(() => runtime.completeLesson("a")).not.toThrow();
  });
});
