import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import { findCourseDir, getRuntimeAssetsDir, loadCourseManifest } from "./utils.js";

describe("findCourseDir", () => {
  const originalCwd = process.cwd();
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "lxpack-find-"));
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("finds course.yaml in the starting directory", async () => {
    const courseDir = join(tempRoot, "my-course");
    await mkdir(courseDir, { recursive: true });
    await writeFile(
      join(courseDir, "course.yaml"),
      "title: T\nversion: 1.0.0\nlessons:\n  - id: a\n    type: markdown\n    file: a.md\n",
    );
    await writeFile(join(courseDir, "a.md"), "# A");
    process.chdir(courseDir);
    expect(realpathSync(findCourseDir())).toBe(realpathSync(courseDir));
  });

  it("walks up parent directories to find course.yaml", async () => {
    const courseDir = join(tempRoot, "course");
    const nested = join(courseDir, "sub", "deep");
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(courseDir, "course.yaml"),
      "title: T\nversion: 1.0.0\nlessons:\n  - id: a\n    type: markdown\n    file: a.md\n",
    );
    await writeFile(join(courseDir, "a.md"), "# A");
    process.chdir(nested);
    expect(realpathSync(findCourseDir())).toBe(realpathSync(courseDir));
  });

  it("throws when no course.yaml exists", () => {
    process.chdir(tempRoot);
    expect(() => findCourseDir()).toThrow(/No course.yaml found/);
  });
});

describe("loadCourseManifest", () => {
  it("loads manifest from fixture course", async () => {
    const manifest = await loadCourseManifest(fixturePath("minimal-valid"));
    expect(manifest.title).toBe("Minimal Valid Course");
  });

  it("throws aggregated errors for invalid courses", async () => {
    await expect(
      loadCourseManifest(fixturePath("invalid-manifest")),
    ).rejects.toThrow();
  });
});

describe("getRuntimeAssetsDir", () => {
  it("points at built runtime client bundle", async () => {
    const clientPath = join(getRuntimeAssetsDir(), "client.js");
    if (!existsSync(clientPath)) {
      const { execSync } = await import("node:child_process");
      execSync("pnpm --filter @lxpack/runtime build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
    expect(existsSync(clientPath)).toBe(true);
  });
});

describe("readRuntimeBundle", () => {
  it("reads client bundle and runtime styles", async () => {
    const { readRuntimeBundle } = await import("./utils.js");
    const bundle = await readRuntimeBundle();
    expect(bundle.clientJs.length).toBeGreaterThan(0);
    expect(bundle.css.length).toBeGreaterThan(0);
  });

});

describe("loadLxpackConfig", () => {
  it("returns null when lxpack.config.ts is missing", async () => {
    const { loadLxpackConfig } = await import("./utils.js");
    const dir = await mkdtemp(join(tmpdir(), "lxpack-no-config-"));
    expect(await loadLxpackConfig(dir)).toBeNull();
  });

  it("returns config object when lxpack.config.ts exists", async () => {
    const { loadLxpackConfig } = await import("./utils.js");
    expect(await loadLxpackConfig(fixturePath("minimal-valid"))).toEqual({});
  });
});

describe("loadCourseYamlRaw", () => {
  it("parses course.yaml", async () => {
    const { loadCourseYamlRaw } = await import("./utils.js");
    const manifest = await loadCourseYamlRaw(fixturePath("minimal-valid"));
    expect(manifest.title).toBe("Minimal Valid Course");
  });
});
