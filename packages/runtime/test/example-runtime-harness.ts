import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, vi } from "vitest";
import {
  buildRuntimeAssessmentBundle,
  loadManifest,
} from "@lxpack/validators";
import type { RuntimeConfig } from "../src/types.js";
import { examplePath } from "../../../test/helpers/examples.js";
import { fixturePath } from "../../../test/helpers/paths.js";

export async function loadExampleRuntimeConfig(
  exampleName: string,
  mode: RuntimeConfig["mode"] = "preview",
): Promise<{ courseDir: string; config: RuntimeConfig }> {
  const courseDir = examplePath(exampleName);
  const loaded = await loadManifest(courseDir);
  if (Array.isArray(loaded)) {
    throw new Error(`Failed to load ${exampleName}: ${loaded.join(", ")}`);
  }
  const { manifest } = loaded;
  const bundle = await buildRuntimeAssessmentBundle(courseDir, manifest);

  const config: RuntimeConfig = {
    manifest,
    baseUrl: "/course",
    mode,
    assessments: bundle.assessments,
    answerKeys: bundle.answerKeys,
    assessmentConfigs: bundle.configs,
    assessmentFeedback: bundle.feedback,
  };

  const activityIri = manifest.tracking?.xapi?.activityIri;
  if (activityIri) {
    config.activityIri = activityIri;
  }

  return { courseDir, config };
}

export async function loadFixtureRuntimeConfig(
  fixtureName: string,
  mode: RuntimeConfig["mode"] = "preview",
): Promise<{ courseDir: string; config: RuntimeConfig }> {
  const courseDir = fixturePath(fixtureName);
  const loaded = await loadManifest(courseDir);
  if (Array.isArray(loaded)) {
    throw new Error(`Failed to load fixture ${fixtureName}: ${loaded.join(", ")}`);
  }
  const { manifest } = loaded;
  const bundle = await buildRuntimeAssessmentBundle(courseDir, manifest);

  const config: RuntimeConfig = {
    manifest,
    baseUrl: "/course",
    mode,
    assessments: bundle.assessments,
    answerKeys: bundle.answerKeys,
    assessmentConfigs: bundle.configs,
    assessmentFeedback: bundle.feedback,
  };

  return { courseDir, config };
}

export function installCourseFetchMock(
  courseDir: string,
  baseUrl = "/course",
): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input), "http://lxpack.test");
    const prefix = `${baseUrl}/`;
    if (!url.pathname.startsWith(prefix)) {
      return new Response("Not found", { status: 404 });
    }
    const rel = url.pathname.slice(prefix.length);
    try {
      const body = await readFile(join(courseDir, rel), "utf-8");
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

/** Minimal components mount matching built-in callout behavior. */
export function installComponentsMount(): void {
  window.__LXPACK_COMPONENTS__ = {
    mount(el, componentId, props) {
      if (componentId === "callout") {
        const variant = String(props.variant ?? "info");
        const body = String(props.body ?? "");
        el.innerHTML = `<aside class="lxpack-callout lxpack-callout-${variant}" role="note"><p>${body}</p></aside>`;
        return;
      }
      el.innerHTML = `<p class="lxpack-error">Unknown component: ${componentId}</p>`;
    },
  };
}

export function setupExampleDom(): void {
  document.body.innerHTML = '<div id="lxpack-app"></div>';
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
}

export function teardownExampleDom(): void {
  document.body.innerHTML = "";
  delete window.__LXPACK_CONFIG__;
  delete window.lxpack;
  delete window.__LXPACK_COMPONENTS__;
}

export function parseLearnerPageConfig(html: string): RuntimeConfig {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.getElementById("lxpack-config");
  if (!el?.textContent) {
    throw new Error("Learner page is missing #lxpack-config");
  }
  return JSON.parse(el.textContent) as RuntimeConfig;
}

export function btn(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!el || !(el instanceof HTMLButtonElement)) {
    throw new Error(`Button #${id} not found`);
  }
  return el;
}

export function getNavBtn(lessonId: string): HTMLButtonElement {
  const el = document.querySelector(
    `[data-nav-id="${lessonId}"]`,
  ) as HTMLButtonElement | null;
  if (!el) throw new Error(`Nav button for ${lessonId} not found`);
  return el;
}

export async function waitForActiveNav(lessonId: string): Promise<void> {
  await vi.waitFor(
    () => {
      const active = document.querySelector(
        `[data-nav-id="${lessonId}"].active`,
      );
      expect(active).toBeTruthy();
    },
    { timeout: 3000 },
  );
}

export async function waitForSelector(selector: string): Promise<Element> {
  let found: Element | null = null;
  await vi.waitFor(
    () => {
      found = document.querySelector(selector);
      expect(found).toBeTruthy();
    },
    { timeout: 3000 },
  );
  return found!;
}

export async function clickNext(): Promise<void> {
  btn("lxpack-next").click();
}

export async function clickPrev(): Promise<void> {
  btn("lxpack-prev").click();
}

/** Simulate SPA lesson completion via the parent bridge API. */
export async function completeSpaLesson(lessonId: string): Promise<void> {
  window.lxpackBridge?.v1?.completeLesson(lessonId);
  await vi.waitFor(() => {
    expect(window.lxpack?.getProgress().completedLessons).toContain(lessonId);
  });
}

export async function clickComplete(): Promise<void> {
  btn("lxpack-complete").click();
}

export async function clickNav(lessonId: string): Promise<void> {
  getNavBtn(lessonId).click();
  await waitForActiveNav(lessonId);
}

/** Maps example interaction HTML to the runtime calls their buttons perform. */
const INTERACTION_BUTTON_ACTIONS: Record<
  string,
  Record<string, (api: NonNullable<Window["lxpack"]>) => void>
> = {
  "interactions/phishing-lab": {
    report: (api) =>
      api.track({
        type: "interaction",
        id: "phishing-lab",
        data: { action: "report" },
      }),
    open: (api) =>
      api.track({
        type: "interaction",
        id: "phishing-lab",
        data: { action: "open_link" },
      }),
    reply: (api) =>
      api.track({
        type: "interaction",
        id: "phishing-lab",
        data: { action: "reply" },
      }),
  },
  "interactions/choose-path": {
    basic: (api) => {
      api.setVariable("path", "intro");
      api.track({
        type: "interaction",
        id: "choose_path",
        data: { path: "basic" },
      });
    },
    advanced: (api) => {
      api.setVariable("path", "advanced");
      api.track({
        type: "interaction",
        id: "choose_path",
        data: { path: "advanced" },
      });
    },
  },
};

/**
 * Asserts the HTML lab is on screen and the named control exists, then runs the
 * same lxpack API calls the interaction button would (happy-dom does not run
 * iframe scripts reliably).
 */
export async function clickInteractionButton(
  buttonId: string,
  options: { courseDir: string; interactionPath: string },
): Promise<void> {
  const html = await readFile(
    join(options.courseDir, options.interactionPath, "index.html"),
    "utf-8",
  );
  expect(html).toContain(`id="${buttonId}"`);

  const action = INTERACTION_BUTTON_ACTIONS[options.interactionPath]?.[buttonId];
  if (!action) {
    throw new Error(
      `No simulated handler for ${options.interactionPath}#${buttonId}`,
    );
  }
  const api = window.lxpack;
  if (!api) throw new Error("window.lxpack is not initialized");
  action(api);
}

export function expectAssessmentPassed(
  assessmentId: string,
  passingScore = 0.7,
): void {
  const score = window.lxpack?.getProgress().assessmentScores[assessmentId];
  expect(score).toBeGreaterThanOrEqual(passingScore);
}

export async function submitQuizWithAnswerKey(
  answerKey: Record<string, string | string[]>,
): Promise<void> {
  await waitForSelector(".lxpack-assessment form");
  for (const [questionId, choiceIds] of Object.entries(answerKey)) {
    const ids = Array.isArray(choiceIds) ? choiceIds : [choiceIds];
    for (const choiceId of ids) {
      const input = document.querySelector(
        `input[name="q-${questionId}"][value="${choiceId}"]`,
      ) as HTMLInputElement | null;
      if (!input) {
        throw new Error(
          `Quiz choice ${choiceId} for question ${questionId} not found`,
        );
      }
      input.checked = true;
    }
  }
  (
    document.querySelector(".lxpack-assessment form") as HTMLFormElement
  ).requestSubmit();
  await vi.waitFor(
    () => {
      const result = document.querySelector(".lxpack-assessment-result");
      const passedNow = document.body.textContent?.includes("Passed!");
      expect(result || passedNow).toBeTruthy();
    },
    { timeout: 3000 },
  );
}
