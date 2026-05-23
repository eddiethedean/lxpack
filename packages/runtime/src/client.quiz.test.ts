import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildNavItems,
  init,
  loadAssessment,
  renderAssessment,
} from "./client.js";

const assessmentYaml = `id: quiz
title: Quiz
passingScore: 0.5
questions:
  - id: q1
    prompt: Pick one
    choices:
      - id: a
        text: Correct
        correct: true
      - id: b
        text: Wrong
`;

describe("quiz client", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    delete window.__LXPACK_CONFIG__;
    delete window.lxpack;
  });

  it("buildNavItems includes assessments after lessons", () => {
    const items = buildNavItems({
      title: "T",
      version: "1.0.0",
      lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
    });
    expect(items).toHaveLength(2);
    expect(items[1]?.kind).toBe("assessment");
  });

  it("loads assessment YAML from the course bundle", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => assessmentYaml,
    } as Response);

    const assessment = await loadAssessment("/course", "assessments/quiz.yaml");
    expect(assessment.id).toBe("quiz");
  });

  it("throws when assessment fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      text: async () => "",
    } as Response);

    await expect(
      loadAssessment("/course", "assessments/missing.yaml"),
    ).rejects.toThrow("Failed to load assessment");
  });

  it("renders and submits an assessment", () => {
    const contentEl = document.createElement("div");
    const runtime = {
      getProgress: () => ({ assessmentScores: {}, completedLessons: [], currentLessonId: "quiz", suspendData: {} }),
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    } as unknown as import("./runtime.js").LxpackRuntime;

    renderAssessment(
      contentEl,
      {
        id: "quiz",
        title: "Quiz",
        passingScore: 0.5,
        questions: [
          {
            id: "q1",
            prompt: "Pick",
            choices: [
              { id: "a", text: "Correct", correct: true },
              { id: "b", text: "Wrong" },
            ],
          },
        ],
      },
      runtime,
      vi.fn(),
    );

    const radio = contentEl.querySelector(
      'input[value="a"]',
    ) as HTMLInputElement;
    radio.checked = true;
    contentEl.querySelector("form")?.dispatchEvent(
      new Event("submit", { cancelable: true }),
    );

    expect(runtime.submitAssessment).toHaveBeenCalledWith("quiz", 1, 0.5);
  });

  it("shows prior assessment results", () => {
    const contentEl = document.createElement("div");
    const runtime = {
      getProgress: () => ({
        assessmentScores: { quiz: 1 },
        completedLessons: [],
        currentLessonId: "quiz",
        suspendData: {},
      }),
      isAssessmentPassed: () => true,
      submitAssessment: vi.fn(),
    } as unknown as import("./runtime.js").LxpackRuntime;

    renderAssessment(
      contentEl,
      {
        id: "quiz",
        passingScore: 0.5,
        questions: [
          {
            id: "q1",
            prompt: "Pick",
            choices: [{ id: "a", text: "Correct", correct: true }],
          },
        ],
      },
      runtime,
      vi.fn(),
    );

    expect(contentEl.textContent).toContain("Passed");
  });

  it("shows failed prior assessment results", () => {
    const contentEl = document.createElement("div");
    const runtime = {
      getProgress: () => ({
        assessmentScores: { quiz: 0.2 },
        completedLessons: [],
        currentLessonId: "quiz",
        suspendData: {},
      }),
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    } as unknown as import("./runtime.js").LxpackRuntime;

    renderAssessment(
      contentEl,
      {
        id: "quiz",
        passingScore: 0.5,
        questions: [
          {
            id: "q1",
            prompt: "Pick",
            choices: [{ id: "a", text: "Correct", correct: true }],
          },
        ],
      },
      runtime,
      vi.fn(),
    );

    expect(contentEl.textContent).toContain("Not passed");
  });

  it("invokes onSubmitted after assessment submit", () => {
    const contentEl = document.createElement("div");
    const onSubmitted = vi.fn();
    const runtime = {
      getProgress: () => ({
        assessmentScores: {},
        completedLessons: [],
        currentLessonId: "quiz",
        suspendData: {},
      }),
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    } as unknown as import("./runtime.js").LxpackRuntime;

    renderAssessment(
      contentEl,
      {
        id: "quiz",
        passingScore: 0.5,
        questions: [
          {
            id: "q1",
            prompt: "Pick",
            choices: [
              { id: "a", text: "Correct", correct: true },
              { id: "b", text: "Wrong" },
            ],
            explanation: "Because A",
          },
        ],
      },
      runtime,
      onSubmitted,
    );

    const radio = contentEl.querySelector(
      'input[value="a"]',
    ) as HTMLInputElement;
    radio.checked = true;
    contentEl.querySelector("form")?.requestSubmit();
    expect(onSubmitted).toHaveBeenCalled();
  });

  it("renders manifest descriptions in the shell", () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Described",
        version: "1.0.0",
        description: "Learn things",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Hi",
    } as Response);
    init();
    expect(document.querySelector(".lxpack-description")?.textContent).toBe(
      "Learn things",
    );
  });

  it("shows passed assessments in navigation state", async () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Quiz Course",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: "/course",
      mode: "preview",
      progress: {
        currentLessonId: "a",
        completedLessons: [],
        assessmentScores: { quiz: 1 },
        suspendData: { assessment_passing_quiz: 0.5 },
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Hi",
    } as Response);

    init();
    await vi.waitFor(() =>
      expect(
        document.querySelector(".lxpack-nav-assessment.completed"),
      ).toBeTruthy(),
    );
  });

  it("marks passed assessments in navigation", async () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Quiz Course",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("quiz.yaml")) {
        return { ok: true, text: async () => assessmentYaml } as Response;
      }
      return { ok: true, text: async () => "# Lesson" } as Response;
    });

    init();
    const next = document.getElementById("lxpack-next") as HTMLButtonElement;
    next.click();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-assessment")).toBeTruthy(),
    );
  });

  it("terminates on pagehide", () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Hi",
    } as Response);
    init();
    window.dispatchEvent(new Event("pagehide"));
  });

  it("scores zero when an assessment has no questions", () => {
    const contentEl = document.createElement("div");
    const runtime = {
      getProgress: () => ({
        assessmentScores: {},
        completedLessons: [],
        currentLessonId: "quiz",
        suspendData: {},
      }),
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    } as unknown as import("./runtime.js").LxpackRuntime;

    renderAssessment(
      contentEl,
      {
        id: "quiz",
        passingScore: 0.5,
        questions: [],
      },
      runtime,
      vi.fn(),
    );

    contentEl.querySelector("form")?.requestSubmit();
    expect(runtime.submitAssessment).toHaveBeenCalledWith("quiz", 0, 0.5);
  });

  it("refreshes the view after submitting via init navigation", async () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Quiz Course",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("quiz.yaml")) {
        return { ok: true, text: async () => assessmentYaml } as Response;
      }
      return { ok: true, text: async () => "# Lesson" } as Response;
    });

    init();
    (document.getElementById("lxpack-next") as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-assessment form")).toBeTruthy(),
    );

    const radio = document.querySelector(
      'input[value="a"]',
    ) as HTMLInputElement;
    radio.checked = true;
    document.querySelector(".lxpack-assessment form")?.requestSubmit();

    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-assessment-result")).toBeTruthy(),
    );
  });

  it("renders non-Error failures in the content area", async () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "a.md" }],
        assessments: [{ id: "quiz", file: "assessments/quiz.yaml" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("quiz.yaml")) {
        return Promise.reject("broken");
      }
      return { ok: true, text: async () => "# Lesson" } as Response;
    });

    init();
    (document.getElementById("lxpack-next") as HTMLButtonElement).click();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-error")?.textContent).toBe(
        "broken",
      ),
    );
  });

  it("shows fetch errors in the content area", async () => {
    document.body.innerHTML = '<div id="lxpack-app"></div>';
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "T",
        version: "1.0.0",
        lessons: [{ id: "a", type: "markdown", file: "missing.md" }],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      text: async () => "",
    } as Response);

    init();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-error")).toBeTruthy(),
    );
  });
});
