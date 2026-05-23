import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import {
  findCourseDir,
  formatCourseTitleForYaml,
  getRuntimeAssetsDir,
  loadCourseManifest,
  loadLxpackConfig,
} from "./utils.js";
import * as utils from "./utils.js";

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

  it("throws when manifest loading returns validation issues", async () => {
    await expect(loadCourseManifest(fixturePath("invalid-yaml"))).rejects.toThrow(
      /Failed to parse YAML/,
    );
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads client bundle and runtime styles", async () => {
    const bundle = await utils.readRuntimeBundle();
    expect(bundle.clientJs.length).toBeGreaterThan(0);
    expect(bundle.css.length).toBeGreaterThan(0);
    expect(bundle.clientJs.includes('from "./runtime.js"')).toBe(false);
  });

  it("throws when the client bundle is missing", async () => {
    await expect(utils.readRuntimeBundle("/nonexistent/runtime")).rejects.toThrow(
      /Runtime bundle not found/,
    );
  });

  it("throws when the client bundle is not self-contained", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-bad-bundle-"));
    await writeFile(join(dir, "client.js"), 'export { x } from "./runtime.js";');
    await expect(utils.readRuntimeBundle(dir)).rejects.toThrow(/not self-contained/);
  });
});

describe("loadRuntimeStyles", () => {
  it("returns embedded CSS when styles.css is missing", async () => {
    const css = await utils.loadRuntimeStyles("/nonexistent/runtime");
    expect(css).toBe(utils.getEmbeddedStyles());
  });
});

describe("loadLxpackConfig", () => {
  it("returns null when lxpack.config.json is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-no-config-"));
    expect(await loadLxpackConfig(dir)).toBeNull();
  });

  it("returns parsed config when lxpack.config.json exists", async () => {
    expect(await loadLxpackConfig(fixturePath("minimal-valid"))).toEqual({
      exports: { defaultTarget: "scorm12" },
      output: { dir: ".lxpack" },
    });
  });

  it("throws for invalid lxpack.config.json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-bad-config-"));
    await writeFile(join(dir, "lxpack.config.json"), "{bad");
    await expect(loadLxpackConfig(dir)).rejects.toThrow(
      /Failed to load lxpack.config.json/,
    );
  });

  it("throws when config schema validation fails", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-schema-config-"));
    await writeFile(
      join(dir, "lxpack.config.json"),
      JSON.stringify({ exports: { defaultTarget: "xapi" } }),
    );
    await expect(loadLxpackConfig(dir)).rejects.toThrow(
      /Failed to load lxpack.config.json/,
    );
  });
});

describe("formatCourseTitleForYaml", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("quotes titles with special characters", () => {
    expect(formatCourseTitleForYaml("My: Course")).toMatch(/^"/);
  });
});
