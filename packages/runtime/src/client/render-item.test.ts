// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeConfig } from "../types.js";
import type { NavItem } from "./types.js";

const loadAssessmentMock = vi.fn();

vi.mock("./assessment-loader.js", () => ({
  loadAssessment: (...args: unknown[]) => loadAssessmentMock(...args),
}));

import { renderItem } from "./render-item.js";

const baseConfig = {
  baseUrl: "/course",
  mode: "preview",
} as RuntimeConfig;

const quizItem: NavItem = {
  id: "quiz",
  kind: "assessment",
  title: "Quiz",
  file: "assessments/quiz.yaml",
};

const otherQuizItem: NavItem = {
  id: "other",
  kind: "assessment",
  title: "Other",
  file: "assessments/other.yaml",
};

describe("renderItem assessments", () => {
  afterEach(() => {
    loadAssessmentMock.mockReset();
    document.body.innerHTML = "";
  });

  it("leaves DOM unchanged when navigation becomes stale during load", async () => {
    let resolveLoad!: () => void;
    const loadDone = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    loadAssessmentMock.mockImplementation(async (_config, _base, id: string) => {
      await loadDone;
      return {
        assessment: {
          id,
          title: id,
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

    const contentEl = document.createElement("div");
    contentEl.innerHTML =
      '<div class="lxpack-assessment"><p>Previous quiz content</p></div>';
    const runtime = {
      getProgress: () => ({
        assessmentScores: {},
        suspendData: {},
        completedLessons: [],
        currentLessonId: "other",
      }),
      getAssessmentAttemptCount: () => 0,
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    };

    const stale = { value: false };
    const renderPromise = renderItem(
      baseConfig,
      runtime,
      contentEl,
      "/course",
      quizItem,
      vi.fn(),
      () => stale.value,
    );

    stale.value = true;
    resolveLoad();
    await renderPromise;

    expect(contentEl.querySelector(".lxpack-assessment")).toBeTruthy();
    expect(contentEl.innerHTML).toContain("Previous quiz content");
  });

  it("renders assessment when navigation is still current", async () => {
    loadAssessmentMock.mockResolvedValue({
      assessment: {
        id: "quiz",
        title: "Quiz",
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
    });

    const contentEl = document.createElement("div");
    const runtime = {
      getProgress: () => ({
        assessmentScores: {},
        suspendData: {},
        completedLessons: [],
        currentLessonId: "other",
      }),
      getAssessmentAttemptCount: () => 0,
      isAssessmentPassed: () => false,
      submitAssessment: vi.fn(),
    };

    await renderItem(
      baseConfig,
      runtime,
      contentEl,
      "/course",
      otherQuizItem,
      vi.fn(),
      () => false,
    );

    expect(contentEl.querySelector(".lxpack-assessment")).toBeTruthy();
  });
});
