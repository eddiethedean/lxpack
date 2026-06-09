// @vitest-environment happy-dom

import { existsSync } from "node:fs";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { validateCourse, buildCourse } from "@lxpack/api";
import { fixturePath } from "../../../test/helpers/paths.js";
import { init } from "../../runtime/src/client.js";
import {
  expectAssessmentFailed,
  expectAssessmentPassed,
  getNavBtn,
  installCourseFetchMock,
  parseLearnerPageConfig,
  setupExampleDom,
  submitQuizWithAnswerKey,
  submitQuizWithSelections,
  teardownExampleDom,
  waitForSelector,
} from "../../runtime/test/example-runtime-harness.js";

const REPO_ROOT = join(import.meta.dirname, "../../..");
const FIXTURE = "multi-select-valid";

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

async function copyFixtureCourse(): Promise<string> {
  const courseDir = await mkdtemp(join(tmpdir(), "lxpack-ms-conformance-"));
  await cp(fixturePath(FIXTURE), courseDir, { recursive: true });
  return courseDir;
}

describe("multi-select SCORM conformance", () => {
  const cleanupDirs: string[] = [];

  beforeAll(async () => {
    await ensureBuiltAssets();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    teardownExampleDom();
    await Promise.all(
      cleanupDirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    cleanupDirs.length = 0;
  });

  it("validateCourse passes for the multi-select fixture", async () => {
    const result = await validateCourse({
      courseDir: fixturePath(FIXTURE),
      target: "scorm12",
    });
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("buildCourse produces a SCORM 1.2 ZIP without validation errors", async () => {
    const courseDir = await copyFixtureCourse();
    cleanupDirs.push(courseDir);
    const zipPath = join(".lxpack", "conformance-scorm12.zip");

    const result = await buildCourse({
      courseDir,
      target: "scorm12",
      output: zipPath,
    });

    expect(result.ok).toBe(true);
    expect(result.outputPath).toBeTruthy();
    const info = await stat(result.outputPath!);
    expect(info.size).toBeGreaterThan(0);
  });

  it("buildCourse produces a SCORM 2004 directory without validation errors", async () => {
    const courseDir = await copyFixtureCourse();
    cleanupDirs.push(courseDir);
    const outRel = join(".lxpack", "conformance-scorm2004");

    const result = await buildCourse({
      courseDir,
      target: "scorm2004",
      dir: true,
      output: outRel,
    });

    expect(result.ok).toBe(true);
    expect(result.outputDir).toBeTruthy();
    const outDir = result.outputDir!;
    expect(existsSync(join(outDir, "imsmanifest.xml"))).toBe(true);
    expect(existsSync(join(outDir, "sco", "quiz", "index.html"))).toBe(true);
  });

  it("compiled SCORM 1.2: selecting all correct choices passes the quiz", async () => {
    const courseDir = await copyFixtureCourse();
    cleanupDirs.push(courseDir);
    const outRel = join(".lxpack", "conformance-walk-scorm12");

    const built = await buildCourse({
      courseDir,
      target: "scorm12",
      dir: true,
      output: outRel,
    });
    expect(built.ok).toBe(true);
    const outDir = built.outputDir!;

    const entryHtml = await readFile(join(outDir, "index.html"), "utf-8");
    const config = parseLearnerPageConfig(entryHtml);
    expect(config.mode).toBe("scorm12");
    expect(config.answerKeys?.quiz?.q1).toEqual(["a", "c"]);

    installCourseFetchMock(outDir, config.baseUrl);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await vi.waitFor(() => {
      expect(document.querySelector(".lxpack-nav-item")).toBeTruthy();
    });
    getNavBtn("quiz").click();
    await waitForSelector(".lxpack-assessment form");
    await submitQuizWithAnswerKey(config.answerKeys!.quiz);
    expectAssessmentPassed("quiz", config.assessments!.quiz.passingScore);
  });

  it("compiled SCORM 1.2: one correct and one incorrect choice fails the quiz", async () => {
    const courseDir = await copyFixtureCourse();
    cleanupDirs.push(courseDir);
    const outRel = join(".lxpack", "conformance-walk-scorm12-fail");

    const built = await buildCourse({
      courseDir,
      target: "scorm12",
      dir: true,
      output: outRel,
    });
    expect(built.ok).toBe(true);
    const outDir = built.outputDir!;

    const entryHtml = await readFile(join(outDir, "index.html"), "utf-8");
    const config = parseLearnerPageConfig(entryHtml);

    installCourseFetchMock(outDir, config.baseUrl);
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
    expect(document.body.textContent).toContain("Not passed");
  });

  it("compiled SCORM 2004 quiz SCO: multi-select passes in the learner shell", async () => {
    const courseDir = await copyFixtureCourse();
    cleanupDirs.push(courseDir);
    const outRel = join(".lxpack", "conformance-walk-scorm2004");

    const built = await buildCourse({
      courseDir,
      target: "scorm2004",
      dir: true,
      output: outRel,
    });
    expect(built.ok).toBe(true);
    const outDir = built.outputDir!;

    const entryHtml = await readFile(
      join(outDir, "sco", "quiz", "index.html"),
      "utf-8",
    );
    const config = parseLearnerPageConfig(entryHtml);
    expect(config.mode).toBe("scorm2004");
    expect(config.activityId).toBe("quiz");
    expect(config.answerKeys?.quiz?.q1).toEqual(["a", "c"]);

    installCourseFetchMock(outDir, config.baseUrl);
    setupExampleDom();
    window.__LXPACK_CONFIG__ = config;
    init();

    await waitForSelector(".lxpack-assessment form");
    await submitQuizWithAnswerKey(config.answerKeys!.quiz);
    expectAssessmentPassed("quiz", config.assessments!.quiz.passingScore);
  });
});
