import { afterEach, describe, expect, it, vi } from "vitest";
import { init } from "./client.js";
import {
  getNavBtn,
  installCourseFetchMock,
  loadFixtureRuntimeConfig,
  setupExampleDom,
  submitQuizWithAnswerKey,
  submitQuizWithSelections,
  expectAssessmentPassed,
  expectAssessmentFailed,
  teardownExampleDom,
  waitForActiveNav,
  waitForSelector,
} from "../test/example-runtime-harness.js";

describe("multi-select fixture walkthrough", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    teardownExampleDom();
  });

  it("renders checkboxes and scores partial credit in preview", async () => {
    const { courseDir, config } = await loadFixtureRuntimeConfig(
      "multi-select-valid",
    );
    installCourseFetchMock(courseDir);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("intro");
    expect(document.querySelector('input[type="checkbox"]')).toBeNull();

    const quizNav = document.querySelector(
      '[data-nav-id="quiz"]',
    ) as HTMLButtonElement | null;
    expect(quizNav).toBeTruthy();
    quizNav!.click();

    await vi.waitFor(() => {
      expect(document.querySelector('input[type="checkbox"]')).toBeTruthy();
      expect(document.body.textContent).toContain("Select all that apply");
    });

    await submitQuizWithAnswerKey(config.answerKeys!.quiz);
    expectAssessmentPassed("quiz", config.assessments!.quiz.passingScore);
  });

  it("fails when one correct and one incorrect choice are selected", async () => {
    const { courseDir, config } = await loadFixtureRuntimeConfig(
      "multi-select-valid",
    );
    installCourseFetchMock(courseDir);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await vi.waitFor(() => {
      expect(document.querySelector(".lxpack-nav-item")).toBeTruthy();
    });
    getNavBtn("quiz").click();

    await waitForSelector(".lxpack-assessment form");
    await submitQuizWithSelections({ q1: ["a", "b"] });
    expectAssessmentFailed("quiz", config.assessments!.quiz.passingScore);
  });
});
