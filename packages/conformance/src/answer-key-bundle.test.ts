import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it, beforeAll, afterEach } from "vitest";
import { packageLessonkit } from "@lxpack/api";
import {
  conformanceMultiSelectInterchange,
  conformanceSpaDir,
} from "./fixture.js";

const REPO_ROOT = join(import.meta.dirname, "../../..");

describe("multi-select answer key bundle conformance", () => {
  const cleanupDirs: string[] = [];

  beforeAll(() => {
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
  });

  afterEach(async () => {
    await Promise.all(
      cleanupDirs.map((d) => rm(d, { recursive: true, force: true }).catch(() => {})),
    );
    cleanupDirs.length = 0;
  });

  it("packages LessonKit interchange with array answer keys in embedded config", async () => {
    const built = await packageLessonkit({
      interchange: conformanceMultiSelectInterchange(),
      spaDirs: { conformance_spa: conformanceSpaDir() },
      target: "standalone",
      dir: true,
      writeAuthoringFiles: true,
      debug: true,
    });

    if (built.courseDir) cleanupDirs.push(built.courseDir);
    if (built.outputDir) cleanupDirs.push(built.outputDir);
    expect(built.ok).toBe(true);
    expect(built.outputDir).toBeTruthy();

    const indexPath = join(built.outputDir!, "index.html");
    const html = await readFile(indexPath, "utf-8");
    expect(html).toContain('"answerKeys"');
    expect(html).toContain('"conformance_quiz"');
    expect(html).toContain('"selectionMode":"multiple"');

    const configMatch = html.match(
      /<script type="application\/json" id="lxpack-config">([\s\S]*?)<\/script>/,
    );
    expect(configMatch?.[1]).toBeTruthy();
    const config = JSON.parse(configMatch![1]!) as {
      answerKeys?: Record<string, Record<string, string | string[]>>;
    };
    expect(config.answerKeys?.conformance_quiz?.q1).toEqual(["a", "c"]);
  }, 120_000);
});
