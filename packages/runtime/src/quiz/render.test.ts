import { describe, expect, it, vi } from "vitest";
import { renderAssessment } from "./render.js";
import type { LxpackRuntime } from "../runtime.js";

const assessment = {
  id: "quiz",
  title: "Quiz",
  passingScore: 0.5,
  questions: [
    {
      id: "q1",
      prompt: "Pick",
      choices: [
        { id: "a", text: "Correct" },
        { id: "b", text: "Wrong" },
      ],
    },
  ],
};

function mockRuntime(overrides: Partial<ReturnType<LxpackRuntime["getProgress"]>> = {}) {
  const progress = {
    assessmentScores: {},
    completedLessons: [],
    currentLessonId: "quiz",
    suspendData: {},
    ...overrides,
  };
  return {
    getProgress: () => progress,
    getAssessmentAttemptCount: (id: string) => {
      const raw = progress.suspendData[`assessment_attempts_${id}`];
      return typeof raw === "number" ? raw : 0;
    },
    isAssessmentPassed: () => false,
    submitAssessment: vi.fn(() => {
      const key = "assessment_attempts_quiz";
      const current = progress.suspendData[key];
      progress.suspendData[key] =
        (typeof current === "number" ? current : 0) + 1;
    }),
  } as unknown as LxpackRuntime;
}

describe("renderAssessment", () => {
  it("shows attempt count on prior results when attempts exceed one", () => {
    const contentEl = document.createElement("div");
    renderAssessment(
      contentEl,
      {
        ...assessment,
        config: { maxAttempts: 3, shuffleChoices: false, showFeedback: "never" },
      },
      { q1: "a" },
      {
        ...mockRuntime({
          assessmentScores: { quiz: 0.8 },
          suspendData: { assessment_attempts_quiz: 2 },
        }),
        isAssessmentPassed: () => true,
      },
      vi.fn(),
    );
    expect(contentEl.textContent).toContain("Attempts: 2");
  });

  it("shows attempts remaining when multiple tries are allowed", () => {
    const contentEl = document.createElement("div");
    renderAssessment(
      contentEl,
      {
        ...assessment,
        config: { maxAttempts: 3, shuffleChoices: false, showFeedback: "never" },
      },
      { q1: "a" },
      mockRuntime(),
      vi.fn(),
    );
    expect(contentEl.textContent).toContain("Attempts remaining: 3");
  });

  it("submits with immediate feedback and allows retry when attempts remain", () => {
    const contentEl = document.createElement("div");
    const runtime = mockRuntime();
    const onSubmitted = vi.fn();

    renderAssessment(
      contentEl,
      {
        ...assessment,
        config: {
          maxAttempts: 3,
          shuffleChoices: true,
          showFeedback: "immediate",
        },
        feedback: { q1: "Because." },
      },
      { q1: "a" },
      runtime,
      onSubmitted,
    );

    const radio = contentEl.querySelector('input[value="b"]') as HTMLInputElement;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));

    const hint = contentEl.querySelector('[data-feedback-for="q1"]') as HTMLElement;
    expect(hint.hidden).toBe(false);

    contentEl.querySelector("form")?.dispatchEvent(
      new Event("submit", { cancelable: true }),
    );

    expect(runtime.submitAssessment).toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalled();
    expect(contentEl.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it("shows a passed message after a successful submit", () => {
    const contentEl = document.createElement("div");
    renderAssessment(
      contentEl,
      {
        ...assessment,
        config: { maxAttempts: 1, shuffleChoices: false, showFeedback: "immediate" },
      },
      { q1: "a" },
      mockRuntime(),
      vi.fn(),
    );
    const radio = contentEl.querySelector('input[value="a"]') as HTMLInputElement;
    radio.checked = true;
    contentEl.querySelector("form")?.dispatchEvent(
      new Event("submit", { cancelable: true }),
    );
    expect(contentEl.textContent).toContain("Passed!");
  });

  it("shows end feedback and removes submit when attempts are exhausted", () => {
    const contentEl = document.createElement("div");
    const runtime = mockRuntime();

    renderAssessment(
      contentEl,
      {
        ...assessment,
        config: {
          maxAttempts: 1,
          shuffleChoices: false,
          showFeedback: "end",
        },
        feedback: { q1: "Explanation" },
      },
      { q1: "a" },
      runtime,
      vi.fn(),
    );

    const radio = contentEl.querySelector('input[value="b"]') as HTMLInputElement;
    radio.checked = true;
    contentEl.querySelector("form")?.dispatchEvent(
      new Event("submit", { cancelable: true }),
    );

    expect(contentEl.textContent).toContain("Not passed");
    expect(contentEl.textContent).toContain("Explanation");
    expect(contentEl.querySelector('button[type="submit"]')).toBeNull();
  });
});
