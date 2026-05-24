import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import JSZip from "jszip";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import { loadManifest } from "@lxpack/validators";
import { packageCourse, packageStandaloneDir } from "./package.js";

const RUNTIME_JS = "export const RUNTIME_STUB = true;";
const RUNTIME_CSS = "body { margin: 0; }";

async function loadBuiltRuntime(): Promise<{ clientJs: string; css: string }> {
  const clientPath = join(
    REPO_ROOT,
    "packages/runtime/dist/client.js",
  );
  if (!existsSync(clientPath)) {
    const { execSync } = await import("node:child_process");
    execSync("pnpm --filter @lxpack/runtime build", {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
  }
  const clientJs = await readFile(clientPath, "utf-8");
  const css = await readFile(
    join(dirname(clientPath), "styles.css"),
    "utf-8",
  );
  return { clientJs, css };
}

describe("packageCourse", () => {
  let manifest: Awaited<ReturnType<typeof loadManifest>>;
  const outputPaths: string[] = [];

  beforeAll(async () => {
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed to load");
    manifest = loaded;
  });

  afterEach(async () => {
    await Promise.all(
      outputPaths.map((p) => rm(p, { recursive: true, force: true }).catch(() => {})),
    );
    outputPaths.length = 0;
  });

  it("creates SCORM 1.2 zip with manifest, index, runtime, and course assets", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-zip-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    const result = await packageCourse({
      courseDir: fixturePath("minimal-valid"),
      manifest: manifest.manifest,
      outputPath: zipPath,
      target: "scorm12",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
    });

    expect(result.outputPath).toBe(zipPath);
    expect(result.fileCount).toBeGreaterThan(5);

    const buffer = await readFile(zipPath);
    const zip = await JSZip.loadAsync(buffer);

    expect(zip.file("imsmanifest.xml")).toBeTruthy();
    expect(zip.file("index.html")).toBeTruthy();
    expect(zip.file("lxpack-runtime.js")).toBeTruthy();
    expect(zip.file("lessons/intro.md")).toBeTruthy();
    expect(zip.file("interactions/lab/index.html")).toBeTruthy();

    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).toContain("<schemaversion>1.2</schemaversion>");

    const index = await zip.file("index.html")?.async("string");
    expect(index).toContain("lxpack-runtime.js");
    expect(index).toContain("Minimal Valid Course");

    const runtime = await zip.file("lxpack-runtime.js")?.async("string");
    expect(runtime).toBe(RUNTIME_JS);
  });

  it("includes components bundle when provided", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-components-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("minimal-valid"),
      manifest: manifest.manifest,
      outputPath: zipPath,
      target: "scorm12",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      componentsBundleJs: "window.__LXPACK_COMPONENTS__={};",
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeTruthy();
    const index = await zip.file("index.html")?.async("string");
    expect(index).toContain("lxpack-components.js");
  });

  it("ships a self-contained production runtime bundle", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-real-bundle-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    const { clientJs, css } = await loadBuiltRuntime();
    expect(clientJs.includes('from "./runtime.js"')).toBe(false);

    await packageCourse({
      courseDir: fixturePath("minimal-valid"),
      manifest: manifest.manifest,
      outputPath: zipPath,
      target: "scorm12",
      runtimeClientJs: clientJs,
      runtimeCss: css,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    const bundled = await zip.file("lxpack-runtime.js")?.async("string");
    expect(bundled).toBeTruthy();
    expect(bundled!.length).toBeGreaterThan(1000);
    expect(bundled!.includes('from "./runtime.js"')).toBe(false);
    expect(bundled!.includes("lxpack-app")).toBe(true);

    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).toContain('href="lxpack-runtime.js"');
    expect(ims).toContain('href="lessons/intro.md"');
  });

  it("creates standalone zip without imsmanifest.xml", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-standalone-"));
    const zipPath = join(outDir, "standalone.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("minimal-valid"),
      manifest: manifest.manifest,
      outputPath: zipPath,
      target: "standalone",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("imsmanifest.xml")).toBeNull();
    expect(zip.file("index.html")).toBeTruthy();
    const index = await zip.file("index.html")?.async("string");
    expect(index).toContain('"mode":"standalone"');
  });

  it("creates SCORM 2004 multi-SCO zip with per-activity launch pages", async () => {
    const loaded = await loadManifest(fixturePath("branching-demo"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-scorm2004-"));
    const zipPath = join(outDir, "branching.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("branching-demo"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "scorm2004",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      componentsBundleJs: "window.__LXPACK_COMPONENTS__={};",
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("imsmanifest.xml")).toBeTruthy();
    expect(zip.file("index.html")).toBeNull();
    expect(zip.file("sco/intro/index.html")).toBeTruthy();
    expect(zip.file("sco/final_quiz/index.html")).toBeTruthy();
    expect(zip.file("assessments/final.yaml")).toBeNull();

    const sco = await zip.file("sco/intro/index.html")?.async("string");
    expect(sco).toContain('"mode":"scorm2004"');
    expect(sco).toContain('"activityId":"intro"');
    expect(sco).toContain("../../lxpack-runtime.js");

    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).toContain("2004 4th Edition");
    expect(ims).toContain("imsss:sequencing");
  });

  it("builds SCORM 2004 without optional components bundle", async () => {
    const loaded = await loadManifest(fixturePath("branching-demo"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-scorm2004-no-comp-"));
    const zipPath = join(outDir, "branching.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("branching-demo"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "scorm2004",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeNull();
    const sco = await zip.file("sco/intro/index.html")?.async("string");
    expect(sco).not.toContain("lxpack-components");
  });
});

describe("packageStandaloneDir", () => {
  it("writes standalone directory without imsmanifest.xml", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-standalone-dir-"));
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const result = await packageStandaloneDir({
      courseDir: fixturePath("minimal-valid"),
      manifest: loaded.manifest,
      outputDir: outDir,
      target: "standalone",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
    });

    expect(result.fileCount).toBeGreaterThan(3);
    const { access } = await import("node:fs/promises");
    await expect(access(join(outDir, "imsmanifest.xml"))).rejects.toThrow();
    const index = await readFile(join(outDir, "index.html"), "utf-8");
    expect(index).toContain('"mode":"standalone"');
    await rm(outDir, { recursive: true, force: true });
  });

  it("writes an unpacked SCORM directory tree", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-dir-"));
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const result = await packageStandaloneDir({
      courseDir: fixturePath("minimal-valid"),
      manifest: loaded.manifest,
      outputDir: outDir,
      target: "scorm12",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
    });

    expect(result.outputDir).toBe(outDir);
    expect(result.fileCount).toBeGreaterThan(4);

    const index = await readFile(join(outDir, "index.html"), "utf-8");
    expect(index).toContain("lxpack-runtime.js");

    const ims = await readFile(join(outDir, "imsmanifest.xml"), "utf-8");
    expect(ims).toContain("1.2");

    await rm(outDir, { recursive: true, force: true });
  });
});
