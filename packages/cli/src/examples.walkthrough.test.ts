// @vitest-environment happy-dom

import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadManifest } from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import {
  EXAMPLE_COURSES,
  compiledExpectationsForTarget,
  examplePath,
} from "../../../test/helpers/examples.js";
import { REPO_ROOT } from "../../../test/helpers/paths.js";
import { buildCommand } from "./commands/build.js";
import {
  clickComplete,
  clickInteractionButton,
  clickNext,
  installComponentsMount,
  installCourseFetchMock,
  parseLearnerPageConfig,
  setupExampleDom,
  submitQuizWithAnswerKey,
  expectAssessmentPassed,
  teardownExampleDom,
  waitForActiveNav,
} from "../../runtime/test/example-runtime-harness.js";

vi.mock("../../runtime/src/client/lessons/html.js", () => ({
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

import { init } from "../../runtime/src/client.js";

async function ensureBuiltAssets(): Promise<void> {
  const client = join(REPO_ROOT, "packages/runtime/dist/client.js");
  if (!existsSync(client)) {
    execSync("pnpm --filter @lxpack/runtime build", {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  }
  const components = join(REPO_ROOT, "packages/components/dist/bundle.js");
  if (!existsSync(components)) {
    execSync("pnpm --filter @lxpack/components build", {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  }
}

describe.sequential("example compiled walkthroughs", () => {
  const originalCwd = process.cwd();
  const cleanupDirs: string[] = [];

  beforeAll(async () => {
    await ensureBuiltAssets();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    teardownExampleDom();
    await Promise.all(
      cleanupDirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    cleanupDirs.length = 0;
  });

  async function walkCompiledFullCourse(
    outDir: string,
    config: ReturnType<typeof parseLearnerPageConfig>,
    name: string,
  ): Promise<void> {
    installCourseFetchMock(outDir, config.baseUrl);
    if (name === "branching-demo") installComponentsMount();
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    const firstId = config.manifest.lessons[0]!.id;
    await waitForActiveNav(firstId);
    await clickComplete();

    const htmlLesson = config.manifest.lessons.find((l) => l.type === "html");
    if (htmlLesson?.type === "html") {
      await clickNext();
      await waitForActiveNav(htmlLesson.id);
      if (name === "branching-demo") {
        await clickInteractionButton("advanced", {
          courseDir: outDir,
          interactionPath: htmlLesson.path,
        });
        await waitForActiveNav("component_lesson");
        await clickComplete();
        await clickNext();
        await waitForActiveNav("wrap_up");
        await clickComplete();
        await clickNext();
      } else {
        await clickInteractionButton("report", {
          courseDir: outDir,
          interactionPath: htmlLesson.path,
        });
        await clickComplete();
        await clickNext();
      }
    }

    const assessmentId = config.manifest.assessments?.[0]?.id;
    if (assessmentId && config.answerKeys?.[assessmentId]) {
      await waitForActiveNav(assessmentId);
      await submitQuizWithAnswerKey(config.answerKeys[assessmentId]);
      expectAssessmentPassed(assessmentId);
    }

    window.dispatchEvent(new Event("beforeunload"));
  }

  async function walkCompiledScorm2004Sco(
    outDir: string,
    activityId: string,
    useComponents: boolean,
  ): Promise<void> {
    const entryRel = `sco/${activityId}/index.html`;
    const entryHtml = await readFile(join(outDir, entryRel), "utf-8");
    const config = parseLearnerPageConfig(entryHtml);
    expect(config.mode).toBe("scorm2004");
    expect(config.activityId).toBe(activityId);

    installCourseFetchMock(outDir, config.baseUrl);
    if (useComponents) installComponentsMount();
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForActiveNav(activityId);

    const lesson = config.manifest.lessons.find((l) => l.id === activityId);
    if (lesson?.type === "markdown") {
      await clickComplete();
      expect(window.lxpack?.getProgress().completedLessons).toContain(activityId);
    } else if (lesson?.type === "html" && lesson.path) {
      await clickInteractionButton("advanced", {
        courseDir: outDir,
        interactionPath: lesson.path,
      });
      expect(window.lxpack?.getVariable("path")).toBe("advanced");
    } else if (lesson?.type === "component") {
      expect(document.querySelector(".lxpack-callout")).toBeTruthy();
      expect(document.body.textContent).toContain("advanced path");
      await clickComplete();
    } else if (config.manifest.assessments?.some((a) => a.id === activityId)) {
      const key = config.answerKeys?.[activityId];
      if (key) {
        await submitQuizWithAnswerKey(key);
        expectAssessmentPassed(activityId);
      }
    }

    window.dispatchEvent(new Event("beforeunload"));
    teardownExampleDom();
    vi.restoreAllMocks();
  }

  for (const { name, targets } of EXAMPLE_COURSES) {
    it(`${name}: learner UI works in compiled ${targets[0]} package`, async () => {
      const target = targets[0] as ExportTarget;
      const courseDir = examplePath(name);
      const outDir = join(courseDir, ".lxpack", `walkthrough-${target}`);
      cleanupDirs.push(outDir);

      process.chdir(courseDir);
      await buildCommand({
        target,
        dir: true,
        output: join(".lxpack", `walkthrough-${target}`),
      });

      const loaded = await loadManifest(courseDir);
      if (Array.isArray(loaded)) throw new Error("manifest load failed");

      if (target === "scorm2004") {
        const activityIds = [
          ...loaded.manifest.lessons.map((l) => l.id),
          ...(loaded.manifest.assessments ?? []).map((a) => a.id),
        ];
        for (const activityId of activityIds) {
          await walkCompiledScorm2004Sco(
            outDir,
            activityId,
            name === "branching-demo",
          );
        }
        return;
      }

      const firstLessonId = loaded.manifest.lessons[0]!.id;
      const expectations = compiledExpectationsForTarget(target, firstLessonId);
      const entryHtml = await readFile(
        join(outDir, expectations.entryRel),
        "utf-8",
      );
      const config = parseLearnerPageConfig(entryHtml);
      expect(config.mode).toBe(expectations.mode);
      expect(config.assessments).toBeTruthy();
      expect(config.answerKeys).toBeTruthy();

      await walkCompiledFullCourse(outDir, config, name);
    });
  }
});
