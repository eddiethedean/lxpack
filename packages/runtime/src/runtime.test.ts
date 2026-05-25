import { beforeEach, describe, it, expect, vi } from "vitest";
import { LxpackRuntime } from "./runtime.js";
import type { ScormData } from "./scorm-api.js";
import * as scormApi from "./scorm-api.js";
import { Scorm12Simulator } from "./scorm-api.js";
import * as scorm2004Api from "./scorm2004-api.js";
import { Scorm2004Simulator } from "./scorm2004-api.js";

const manifest = {
  title: "Test",
  version: "1.0.0",
  tracking: { completion: { threshold: 0.5 } },
  lessons: [
    { id: "a", type: "markdown" as const, file: "a.md" },
    { id: "b", type: "markdown" as const, file: "b.md" },
  ],
};

function mockLms(initialData?: Partial<ScormData>): Scorm12Simulator {
  const sim = new Scorm12Simulator({
    persistToStorage: false,
    initialData,
  });
  vi.spyOn(scormApi, "createScormConnection").mockReturnValue(sim);
  return sim;
}

function mockScorm2004(initial?: Record<string, string>): Scorm2004Simulator {
  const sim = new Scorm2004Simulator({ persistToStorage: false });
  if (initial) {
    sim.Initialize();
    for (const [key, value] of Object.entries(initial)) {
      sim.SetValue(key, value);
    }
  }
  vi.spyOn(scorm2004Api, "createScorm2004Connection").mockReturnValue(sim);
  return sim;
}

describe("LxpackRuntime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.clear();
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

  it("restores progress from localStorage in preview mode", () => {
    const previewManifest = {
      title: "Persist",
      version: "2.0.0",
      lessons: manifest.lessons,
    };
    const runtime1 = new LxpackRuntime({
      manifest: previewManifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime1.completeLesson("a");

    const runtime2 = new LxpackRuntime({
      manifest: previewManifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime2.isLessonComplete("a")).toBe(true);
  });

  it("ignores invalid completedLessons shapes in localStorage", () => {
    const slug = `${manifest.title}::${manifest.version}`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(
      `lxpack_progress_${Math.abs(hash)}`,
      JSON.stringify({
        currentLessonId: "b",
        completedLessons: "invalid",
        assessmentScores: {},
        suspendData: {},
      }),
    );
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.getProgress().completedLessons).toEqual([]);
  });

  it("ignores localStorage failures during restore", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.getProgress().currentLessonId).toBe("a");
  });

  it("ignores corrupt localStorage progress payloads", () => {
    const badManifest = { ...manifest, title: "Bad", version: "9.9.9" };
    const slug = `${badManifest.title}::${badManifest.version}`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(`lxpack_progress_${Math.abs(hash)}`, "{bad");
    const runtime = new LxpackRuntime({
      manifest: badManifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.getProgress().currentLessonId).toBe("a");
  });

  it("defaults passing score when stored value is not numeric", () => {
    const slug = `Test::1.0.0`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(
      `lxpack_progress_${Math.abs(hash)}`,
      JSON.stringify({
        currentLessonId: "a",
        completedLessons: [],
        assessmentScores: { quiz: 0.8 },
        suspendData: { assessment_passing_quiz: "not-a-number" },
      }),
    );
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
  });

  it("restores progress in standalone mode", () => {
    const slug = `Test::1.0.0`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(
      `lxpack_progress_${Math.abs(hash)}`,
      JSON.stringify({
        currentLessonId: "b",
        assessmentScores: { extra: 0.95 },
        suspendData: { note: true },
      }),
    );
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "standalone",
    });
    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.getProgress().completedLessons).toEqual([]);
    expect(runtime.getProgress().assessmentScores.extra).toBe(0.95);
  });

  it("tracks assessment scores using configured default passing thresholds", () => {
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: ".",
      mode: "preview",
      assessments: {
        quiz: {
          id: "quiz",
          passingScore: 0.5,
          questions: [{ id: "q1", prompt: "P", choices: [{ id: "a", text: "A" }] }],
        },
      },
      answerKeys: { quiz: { q1: "a" } },
    });
    runtime.track({ type: "assessment", id: "quiz", data: { score: 0.6 } });
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
  });

  it("tracks assessment events with passing scores", () => {
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: ".",
      mode: "preview",
      assessments: {
        quiz: {
          id: "quiz",
          passingScore: 0.5,
          questions: [{ id: "q1", prompt: "P", choices: [{ id: "a", text: "A" }] }],
        },
      },
      answerKeys: { quiz: { q1: "a" } },
    });
    runtime.track({
      type: "assessment",
      id: "quiz",
      data: { score: 0.9, passingScore: 0.5 },
    });
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
  });

  it("tracks assessment events without persisting when disabled", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    runtime.track(
      { type: "assessment", id: "quiz", data: { score: 0.5, passingScore: 0.4 } },
      { persist: false },
    );
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("uses configured default passing scores on restore", () => {
    const slug = `Test::1.0.0`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(
      `lxpack_progress_${Math.abs(hash)}`,
      JSON.stringify({
        currentLessonId: "a",
        completedLessons: [],
        assessmentScores: { quiz: 0.6 },
        suspendData: {},
      }),
    );
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: ".",
      mode: "preview",
      assessments: {
        quiz: {
          id: "quiz",
          passingScore: 0.5,
          questions: [{ id: "q1", prompt: "P", choices: [{ id: "a", text: "A" }] }],
        },
      },
      answerKeys: { quiz: { q1: "a" } },
    });
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
  });

  it("terminates only once", () => {
    const sim = mockLms();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    runtime.terminate();
    runtime.terminate();
    expect(sim.LMSGetValue("cmi.core.lesson_status")).toBeDefined();
  });

  it("tracks interaction events in suspend data", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.track({ type: "interaction", id: "btn-1", data: { clicked: true } });
    expect(runtime.getProgress().suspendData["interaction_btn-1"]).toEqual({
      clicked: true,
    });
    runtime.track({ type: "interaction", id: "btn-2" });
    expect(runtime.getProgress().suspendData["interaction_btn-2"]).toBe(true);
  });

  it("markInteractionLessonDone enables flow interaction.done for html lesson id", () => {
    const flowManifest = {
      title: "Flow",
      version: "1.0.0",
      lessons: [
        {
          id: "phishing-lab",
          type: "html" as const,
          path: "interactions/phishing-lab",
        },
        { id: "wrap", type: "markdown" as const, file: "wrap.md" },
      ],
      flow: [
        {
          when: { interaction: { done: "phishing-lab" } },
          goto: "wrap",
        },
      ],
    };
    const runtime = new LxpackRuntime({
      manifest: flowManifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.track({ type: "interaction", id: "phishing_detected" });
    expect(runtime.getFlowContext().isInteractionDone("phishing-lab")).toBe(
      false,
    );
    runtime.markInteractionLessonDone("phishing-lab");
    expect(runtime.getFlowContext().isInteractionDone("phishing-lab")).toBe(
      true,
    );
    expect(runtime.resolveFlowNavigation()).toBe("wrap");
  });

  it("ignores markInteractionLessonDone for non-html lessons", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.markInteractionLessonDone("a");
    expect(runtime.getFlowContext().isInteractionDone("a")).toBe(false);
  });

  it("restores progress via local bridge in preview mode without SCORM", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
      progress: {
        currentLessonId: "b",
        completedLessons: ["a"],
        assessmentScores: {},
        suspendData: {},
      },
    });
    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.getProgress().completedLessons).toContain("a");
  });

  it("uses default passing score for unknown assessment ids", () => {
    const slug = `Test::1.0.0`;
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash << 5) - hash + slug.charCodeAt(i);
      hash |= 0;
    }
    localStorage.setItem(
      `lxpack_progress_${Math.abs(hash)}`,
      JSON.stringify({
        currentLessonId: "a",
        completedLessons: [],
        assessmentScores: { unknown: 0.75 },
        suspendData: {},
      }),
    );
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime.isAssessmentPassed("unknown")).toBe(true);
  });

  it("restores lesson location when suspend_data is empty", () => {
    mockLms({ lessonLocation: "b" });
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("exposes submitAssessment through the public API", () => {
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: ".",
      mode: "preview",
    });
    runtime.getAPI().submitAssessment("quiz", 1, 0.5);
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
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

  it("ignores invalid lesson ids", () => {
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "preview",
    });
    runtime.completeLesson("invalid");
    expect(runtime.getProgress().completedLessons).toEqual([]);
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
    expect(runtime.getProgress().suspendData["interaction_click-1"]).toEqual({
      x: 1,
    });
  });

  it("updates SCORM lesson location when changing lessons", () => {
    const sim = mockLms();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    runtime.setCurrentLesson("b");
    expect(sim.LMSGetValue("cmi.core.lesson_location")).toBe("b");
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
    const sim = mockLms();
    const runtime = new LxpackRuntime({
      manifest: {
        ...manifest,
        tracking: { completion: { threshold: 0.6 } },
      },
      baseUrl: ".",
      mode: "scorm12",
    });

    runtime.completeLesson("a");
    expect(sim.LMSGetValue("cmi.core.lesson_status")).toBe("incomplete");
    expect(sim.LMSGetValue("cmi.core.score.raw")).toBe("50");

    runtime.completeLesson("b");
    expect(sim.LMSGetValue("cmi.core.lesson_status")).toBe("completed");
    expect(sim.LMSGetValue("cmi.core.score.raw")).toBe("100");
  });

  it("ignores corrupt suspend_data in scorm12 mode", () => {
    mockLms({ suspendData: "not-json" });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });

    expect(runtime.getProgress().currentLessonId).toBe("a");
  });

  it("ignores invalid completedLessons in SCORM suspend_data", () => {
    mockLms({
      suspendData: JSON.stringify({
        currentLessonId: "b",
        completedLessons: "invalid",
        assessmentScores: {},
        suspendData: {},
      }),
    });
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    expect(runtime.getProgress().completedLessons).toEqual([]);
    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("restores valid suspend_data in scorm12 mode", () => {
    mockLms({
      suspendData: JSON.stringify({
        currentLessonId: "b",
        completedLessons: ["a"],
        assessmentScores: {},
        suspendData: {},
      }),
    });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.isLessonComplete("a")).toBe(true);
  });

  it("restores lesson_location when suspend_data is empty", () => {
    mockLms({ lessonLocation: "b", suspendData: "" });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("submits assessments and updates completion", () => {
    const sim = mockLms();
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "scorm12",
    });

    runtime.completeLesson("a");
    runtime.completeLesson("b");
    runtime.submitAssessment("quiz", 0.8, 0.7);

    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
    expect(sim.LMSGetValue("cmi.core.lesson_status")).toBe("passed");
  });

  it("marks failed assessments in SCORM status", () => {
    mockLms();
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "scorm12",
    });

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(runtime.isAssessmentPassed("quiz")).toBe(false);
  });

  it("persists assessment attempt counts across submits", () => {
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "preview",
      assessmentConfigs: {
        quiz: { maxAttempts: 3, shuffleChoices: false, showFeedback: "never" },
      },
    });

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(runtime.getAssessmentAttemptCount("quiz")).toBe(1);
    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(runtime.getAssessmentAttemptCount("quiz")).toBe(2);
  });

  it("ignores submitAssessment after maxAttempts exhausted", () => {
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "preview",
      assessmentConfigs: {
        quiz: { maxAttempts: 2, shuffleChoices: false, showFeedback: "never" },
      },
    });

    runtime.submitAssessment("quiz", 0.2, 0.7);
    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(runtime.getAssessmentAttemptCount("quiz")).toBe(2);
    runtime.submitAssessment("quiz", 0.9, 0.7);
    expect(runtime.getAssessmentAttemptCount("quiz")).toBe(2);
    expect(runtime.isAssessmentPassed("quiz")).toBe(false);
  });

  it("ignores submitAssessment when already passed", () => {
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "preview",
    });

    runtime.submitAssessment("quiz", 0.9, 0.7);
    expect(runtime.isAssessmentPassed("quiz")).toBe(true);
    runtime.submitAssessment("quiz", 0.1, 0.7);
    expect(runtime.getProgress().assessmentScores.quiz).toBe(0.9);
  });

  it("does not mark SCORM failed until quiz attempts are exhausted", () => {
    const sim = mockLms();
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "scorm12",
      assessmentConfigs: {
        quiz: { maxAttempts: 3, shuffleChoices: false, showFeedback: "never" },
      },
    });

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(sim.LMSGetValue("cmi.core.lesson_status")).not.toBe("failed");

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(sim.LMSGetValue("cmi.core.lesson_status")).not.toBe("failed");

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(sim.LMSGetValue("cmi.core.lesson_status")).toBe("failed");
  });

  it("restores passed assessments from saved progress", () => {
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime1 = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "preview",
    });
    runtime1.submitAssessment("quiz", 0.9, 0.5);

    const runtime2 = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "preview",
    });
    expect(runtime2.isAssessmentPassed("quiz")).toBe(true);
  });

  it("terminates SCORM session", () => {
    const sim = mockLms();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    runtime.terminate();
    expect(sim.LMSFinish()).toBe("false");
  });

  it("swallows localStorage errors when persisting progress", () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (key.startsWith("lxpack_progress")) throw new Error("quota");
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
    mockLms();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm12",
    });
    expect(() => runtime.completeLesson("a")).not.toThrow();
  });

  it("honors activityId override in SCORM 2004 mode", () => {
    mockScorm2004();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm2004",
      activityId: "b",
    });
    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("restores SCORM 2004 suspend data and activity id", () => {
    mockScorm2004({
      "cmi.suspend_data": JSON.stringify({
        currentLessonId: "b",
        completedLessons: ["a"],
        assessmentScores: {},
        suspendData: {},
      }),
    });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm2004",
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
    expect(runtime.isLessonComplete("a")).toBe(true);
  });

  it("updates SCORM 2004 status on assessment submit", () => {
    const sim = mockScorm2004();
    const manifestWithQuiz = {
      ...manifest,
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    };
    const runtime = new LxpackRuntime({
      manifest: manifestWithQuiz,
      baseUrl: ".",
      mode: "scorm2004",
    });

    runtime.completeLesson("a");
    runtime.completeLesson("b");
    runtime.submitAssessment("quiz", 0.9, 0.7);
    expect(sim.GetValue("cmi.success_status")).toBe("passed");
    expect(sim.GetValue("cmi.completion_status")).toBe("completed");

    runtime.submitAssessment("quiz", 0.2, 0.7);
    expect(sim.GetValue("cmi.success_status")).toBe("passed");
  });

  it("falls back to cmi.location when SCORM 2004 suspend data is corrupt", () => {
    mockScorm2004({
      "cmi.suspend_data": "not-json",
      "cmi.location": "b",
    });

    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm2004",
    });

    expect(runtime.getProgress().currentLessonId).toBe("b");
  });

  it("terminates SCORM 2004 session", () => {
    const sim = mockScorm2004();
    const runtime = new LxpackRuntime({
      manifest,
      baseUrl: ".",
      mode: "scorm2004",
    });
    runtime.terminate();
    expect(sim.Terminate()).toBe("false");
  });
});
