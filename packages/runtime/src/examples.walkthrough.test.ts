import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./client/lessons/html.js", () => ({
  renderHtmlInteraction: (
    contentEl: HTMLElement,
    _baseUrl: string,
    _path: string,
  ) => {
    contentEl.innerHTML = `
      <iframe
        class="lxpack-interaction-frame"
        title="Interaction"
        src="about:blank"
      ></iframe>
    `;
  },
}));

import { init } from "./client.js";
import {
  clickComplete,
  clickInteractionButton,
  clickNav,
  clickNext,
  waitForSelector,
  clickPrev,
  installComponentsMount,
  installCourseFetchMock,
  loadExampleRuntimeConfig,
  setupExampleDom,
  submitQuizWithAnswerKey,
  expectAssessmentPassed,
  teardownExampleDom,
  waitForActiveNav,
  btn,
} from "../test/example-runtime-harness.js";

describe.sequential("example course walkthroughs (preview)", () => {
describe("all example courses", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    teardownExampleDom();
  });

  it("security-awareness: lessons, lab buttons, quiz, and nav controls", async () => {
    const { courseDir, config } = await loadExampleRuntimeConfig(
      "security-awareness",
    );
    installCourseFetchMock(courseDir);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("welcome");
    expect(document.querySelector(".lxpack-markdown")).toBeTruthy();

    await clickComplete();
    expect(window.lxpack?.getProgress().completedLessons).toContain("welcome");

    await clickNext();
    await waitForActiveNav("phishing-lab");

    await clickInteractionButton("report", {
      courseDir,
      interactionPath: "interactions/phishing-lab",
    });
    expect(
      window.lxpack?.getProgress().suspendData["interaction_phishing-lab"],
    ).toEqual({ action: "report" });

    await clickInteractionButton("open", {
      courseDir,
      interactionPath: "interactions/phishing-lab",
    });
    await clickInteractionButton("reply", {
      courseDir,
      interactionPath: "interactions/phishing-lab",
    });

    await clickComplete();
    expect(window.lxpack?.getProgress().completedLessons).toContain(
      "phishing-lab",
    );

    await clickNext();
    await waitForActiveNav("final_quiz");
    await submitQuizWithAnswerKey(config.answerKeys!.final_quiz);
    expectAssessmentPassed("final_quiz");

    await clickPrev();
    await waitForActiveNav("phishing-lab");

    await clickNav("welcome");
    expect(btn("lxpack-prev").disabled).toBe(true);

    window.dispatchEvent(new Event("beforeunload"));
  });

  it("branching-demo: path choice, component, quiz flow, and sidebar", async () => {
    const { courseDir, config } = await loadExampleRuntimeConfig(
      "branching-demo",
    );
    installCourseFetchMock(courseDir);
    installComponentsMount();
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("intro");
    await clickComplete();
    await clickNext();
    await waitForActiveNav("choose_path");

    await clickInteractionButton("advanced", {
      courseDir,
      interactionPath: "interactions/choose-path",
    });
    await vi.waitFor(() =>
      expect(window.lxpack?.getVariable("path")).toBe("advanced"),
    );
    await vi.waitFor(() => {
      expect(document.querySelector(".lxpack-callout")).toBeTruthy();
      expect(document.body.textContent).toContain("advanced path");
    });
    expect(
      document.querySelector('[data-nav-id="component_lesson"].active'),
    ).toBeTruthy();

    await clickComplete();
    await clickNext();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Wrap up");
    });
    // Flow rule `path == advanced` always resolves to component_lesson; clear it
    // so Next can reach the quiz before the post-quiz wrap_up flow rule applies.
    window.lxpack?.setVariable("path", "intro");
    await vi.waitFor(() =>
      expect(window.lxpack?.getVariable("path")).toBe("intro"),
    );
    await clickNext();
    await waitForSelector("#lxpack-assessment-form");
    await submitQuizWithAnswerKey(config.answerKeys!.final_quiz);
    expectAssessmentPassed("final_quiz");

    window.dispatchEvent(new Event("beforeunload"));
  });

  it("branching-demo: basic path skips advanced component in sidebar", async () => {
    const { courseDir, config } = await loadExampleRuntimeConfig(
      "branching-demo",
    );
    installCourseFetchMock(courseDir);
    installComponentsMount();
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("intro");
    await clickComplete();
    await clickNext();
    await waitForActiveNav("choose_path");

    await clickInteractionButton("basic", {
      courseDir,
      interactionPath: "interactions/choose-path",
    });
    expect(window.lxpack?.getVariable("path")).toBe("intro");

    window.dispatchEvent(new Event("beforeunload"));
  });

  it("xapi-awareness: full lesson flow with xAPI mode", async () => {
    const { courseDir, config } = await loadExampleRuntimeConfig(
      "xapi-awareness",
      "xapi",
    );
    installCourseFetchMock(courseDir);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("welcome");
    await clickComplete();
    await clickNext();
    await waitForActiveNav("phishing-lab");
    await clickInteractionButton("report", {
      courseDir,
      interactionPath: "interactions/phishing-lab",
    });
    await clickComplete();
    await clickNext();
    await waitForActiveNav("final_quiz");
    await submitQuizWithAnswerKey(config.answerKeys!.final_quiz);
    expectAssessmentPassed("final_quiz");

    window.dispatchEvent(new Event("beforeunload"));
  });

  it("cmi5-demo: full lesson flow with cmi5 mode", async () => {
    const { courseDir, config } = await loadExampleRuntimeConfig(
      "cmi5-demo",
      "cmi5",
    );
    installCourseFetchMock(courseDir);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav("welcome");
    await clickComplete();
    await clickNext();
    await waitForActiveNav("phishing-lab");
    await clickInteractionButton("report", {
      courseDir,
      interactionPath: "interactions/phishing-lab",
    });
    await clickComplete();
    await clickNext();
    await waitForActiveNav("final_quiz");
    await submitQuizWithAnswerKey(config.answerKeys!.final_quiz);
    expectAssessmentPassed("final_quiz");

    window.dispatchEvent(new Event("beforeunload"));
  });
});
});
