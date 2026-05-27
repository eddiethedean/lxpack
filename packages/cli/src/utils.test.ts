import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import {
  resolveBuildOutputPath,
  resolveOutputDir,
} from "./lib/lxpack-config.js";
import {
  findCourseDir,
  formatCourseTitleForYaml,
  getRuntimeAssetsDir,
  loadCourseManifest,
  loadLxpackConfig,
  resolvePathInCwd,
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

describe("readComponentsBundle", () => {
  it("loads the built components bundle when installed", async () => {
    const bundle = await utils.readComponentsBundle();
    expect(bundle === undefined || bundle.includes("__LXPACK_COMPONENTS__")).toBe(
      true,
    );
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
      JSON.stringify({ exports: { defaultTarget: "not-valid" } }),
    );
    await expect(loadLxpackConfig(dir)).rejects.toThrow(
      /Failed to load lxpack.config.json/,
    );
  });
});

describe("resolvePathInCwd", () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("resolves relative paths inside cwd", async () => {
    const parent = await mkdtemp(join(tmpdir(), "lxpack-resolve-cwd-"));
    await mkdir(join(parent, "child"), { recursive: true });
    process.chdir(parent);
    expect(resolvePathInCwd("child")).toContain("child");
  });

  it("rejects absolute paths", () => {
    expect(() => resolvePathInCwd("/tmp/outside")).toThrow(
      "Use a relative path",
    );
  });

  it("rejects traversal paths", () => {
    expect(() => resolvePathInCwd("../outside")).toThrow(
      "inside the current working directory",
    );
  });
});

describe("resolveOutputDir", () => {
  it("resolves output inside the course directory", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-output-dir-"));
    mkdirSync(join(courseDir, ".lxpack"), { recursive: true });
    expect(resolveOutputDir(courseDir, ".lxpack/out")).toBe(
      join(realpathSync(courseDir), ".lxpack/out"),
    );
  });

  it("rejects output paths that escape the course", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-output-escape-"));
    expect(() => resolveOutputDir(courseDir, "../outside")).toThrow(
      "must stay inside the course directory",
    );
  });

  it("rejects output dirs that are symlinks to outside the course", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-output-symlink-"));
    const outside = await mkdtemp(join(tmpdir(), "lxpack-output-outside-"));
    mkdirSync(join(courseDir, ".lxpack"), { recursive: true });
    await (await import("node:fs/promises")).symlink(
      outside,
      join(courseDir, ".lxpack", "out"),
    );
    expect(() => resolveOutputDir(courseDir, ".lxpack/out")).toThrow(
      "must stay inside the course directory",
    );
  });
});

describe("resolveBuildOutputPath", () => {
  it("resolves relative output inside the course", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-build-out-"));
    const zip = resolveBuildOutputPath(courseDir, "out.zip");
    expect(zip).toBe(join(realpathSync(courseDir), "out.zip"));
  });

  it("rejects output outside the course directory", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-build-escape-"));
    expect(() => resolveBuildOutputPath(courseDir, "../outside.zip")).toThrow(
      "must stay inside the course directory",
    );
  });

  it("rejects absolute output outside the course", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-build-abs-"));
    const outside = await mkdtemp(join(tmpdir(), "lxpack-build-outside-"));
    expect(() => resolveBuildOutputPath(courseDir, join(outside, "x.zip"))).toThrow(
      "must stay inside the course directory",
    );
  });

  it("validates realpath when the output file already exists", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-build-existing-"));
    const out = join(courseDir, "out.zip");
    await writeFile(out, "zip");
    expect(resolveBuildOutputPath(courseDir, "out.zip")).toBe(
      join(realpathSync(courseDir), "out.zip"),
    );
  });

  it("rejects output files that are symlinks to outside the course", async () => {
    const courseDir = await mkdtemp(join(tmpdir(), "lxpack-build-symlink-"));
    const outside = await mkdtemp(join(tmpdir(), "lxpack-build-symlink-outside-"));
    await writeFile(join(outside, "x.zip"), "zip");
    await (await import("node:fs/promises")).symlink(
      join(outside, "x.zip"),
      join(courseDir, "out.zip"),
    );
    expect(() => resolveBuildOutputPath(courseDir, "out.zip")).toThrow(
      "must stay inside the course directory",
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
