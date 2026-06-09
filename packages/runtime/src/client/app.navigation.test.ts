// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

const loadAssessmentMock = vi.fn();

vi.mock("./assessment-loader.js", () => ({
  loadAssessment: (...args: unknown[]) => loadAssessmentMock(...args),
}));

import { init } from "./app.js";

function setupDom(): void {
  document.body.innerHTML = '<div id="lxpack-app"></div>';
}

describe("app navigation", () => {
  afterEach(() => {
    loadAssessmentMock.mockReset();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    delete window.__LXPACK_CONFIG__;
    delete window.lxpack;
    delete window.lxpackBridge;
  });

  it("shows loading placeholder when navigating away during assessment fetch", async () => {
    let resolveLoad!: () => void;
    const loadDone = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    loadAssessmentMock.mockImplementation(async () => {
      await loadDone;
      return {
        assessment: {
          id: "quiz_b",
          title: "Quiz B",
          passingScore: 0.7,
          questions: [
            {
              id: "q1",
              prompt: "Q?",
              choices: [{ id: "a", text: "A", correct: true }],
            },
          ],
        },
        answerKey: { q1: "a" },
      };
    });

    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Nav Test",
        version: "1.0.0",
        lessons: [{ id: "intro", type: "markdown", file: "lessons/intro.md" }],
        assessments: [
          { id: "quiz_a", file: "assessments/a.yaml" },
          { id: "quiz_b", file: "assessments/b.yaml" },
        ],
      },
      baseUrl: "/course",
      mode: "preview",
      assessments: {
        quiz_a: {
          id: "quiz_a",
          title: "Quiz A",
          passingScore: 0.7,
          questions: [
            {
              id: "q1",
              prompt: "A?",
              choices: [{ id: "a", text: "A", correct: true }],
            },
          ],
        },
        quiz_b: {
          id: "quiz_b",
          title: "Quiz B",
          passingScore: 0.7,
          questions: [
            {
              id: "q1",
              prompt: "B?",
              choices: [{ id: "a", text: "A", correct: true }],
            },
          ],
        },
      },
      answerKeys: { quiz_a: { q1: "a" }, quiz_b: { q1: "a" } },
      assessmentConfigs: {
        quiz_a: { maxAttempts: 1, shuffleChoices: false, showFeedback: "never" },
        quiz_b: { maxAttempts: 1, shuffleChoices: false, showFeedback: "never" },
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Intro",
    } as Response);

    setupDom();
    init();

    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-nav-item.active")?.textContent).toContain(
        "intro",
      ),
    );

    const quizBNav = document.querySelector(
      '[data-nav-id="quiz_b"]',
    ) as HTMLElement;
    expect(quizBNav).toBeTruthy();
    quizBNav.click();

    expect(document.querySelector(".lxpack-loading")).toBeTruthy();
    expect(document.querySelector(".lxpack-assessment")).toBeNull();
    expect(document.body.innerHTML).not.toContain("Quiz A");

    resolveLoad();
    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-assessment")).toBeTruthy(),
    );
  });

  it("marks html lesson done by interaction id after navigating away", async () => {
    window.__LXPACK_CONFIG__ = {
      manifest: {
        title: "Track Test",
        version: "1.0.0",
        lessons: [
          { id: "phishing-lab", type: "html", path: "interactions/lab" },
          { id: "welcome", type: "markdown", file: "lessons/welcome.md" },
        ],
      },
      baseUrl: "/course",
      mode: "preview",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "# Welcome",
    } as Response);

    setupDom();
    init();

    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-interaction-frame")).toBeTruthy(),
    );

    const nextBtn = document.getElementById("lxpack-next") as HTMLButtonElement;
    nextBtn.click();

    await vi.waitFor(() =>
      expect(document.querySelector(".lxpack-markdown")).toBeTruthy(),
    );

    window.lxpack?.track({
      type: "interaction",
      id: "phishing_detected",
      data: true,
    });

    expect(
      window.lxpack?.getProgress().suspendData["interaction_phishing-lab"],
    ).toBe(true);
  });
});
