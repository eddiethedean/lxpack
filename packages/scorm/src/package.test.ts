import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import JSZip from "jszip";
import { fixturePath, REPO_ROOT } from "../../../test/helpers/paths.js";
import {
  buildRuntimeAssessmentBundle,
  loadManifest,
  type RuntimeAssessmentBundle,
} from "@lxpack/validators";
import {
  CoursePackagingError,
  packageCourse,
  packageScorm2004Dir,
  packageStandaloneDir,
} from "./package.js";

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
  let minimalAssessmentBundle: RuntimeAssessmentBundle;
  const outputPaths: string[] = [];

  beforeAll(async () => {
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed to load");
    manifest = loaded;
    minimalAssessmentBundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      loaded.manifest,
    );
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
      assessmentBundle: minimalAssessmentBundle,
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

  it("embeds multi-select answer keys in SCORM 1.2 packages", async () => {
    const loaded = await loadManifest(fixturePath("multi-select-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed to load");
    const assessmentBundle = await buildRuntimeAssessmentBundle(
      fixturePath("multi-select-valid"),
      loaded.manifest,
    );

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-multiselect-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("multi-select-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "scorm12",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle,
    });

    const buffer = await readFile(zipPath);
    const zip = await JSZip.loadAsync(buffer);
    const index = await zip.file("index.html")?.async("string");
    expect(index).toContain('"answerKeys"');
    expect(index).toContain('"a"');
    expect(index).toContain('"c"');
    expect(index).toContain('"selectionMode":"multiple"');
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
      assessmentBundle: minimalAssessmentBundle,
      componentsBundleJs: "window.__LXPACK_COMPONENTS__={};",
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeTruthy();
    const index = await zip.file("index.html")?.async("string");
    expect(index).toContain("lxpack-components.js");
    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).toContain('href="lxpack-components.js"');
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
      assessmentBundle: minimalAssessmentBundle,
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
      assessmentBundle: minimalAssessmentBundle,
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
    const branchingBundle = await buildRuntimeAssessmentBundle(
      fixturePath("branching-demo"),
      loaded.manifest,
    );

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
      assessmentBundle: branchingBundle,
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
    const branchingBundle = await buildRuntimeAssessmentBundle(
      fixturePath("branching-demo"),
      loaded.manifest,
    );

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
      assessmentBundle: branchingBundle,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeNull();
    const sco = await zip.file("sco/intro/index.html")?.async("string");
    expect(sco).not.toContain("lxpack-components");
    const ims = await zip.file("imsmanifest.xml")?.async("string");
    expect(ims).not.toContain("lxpack-components.js");
  });

  it("embeds per-SCO answer keys only on assessment launch pages", async () => {
    const loaded = await loadManifest(fixturePath("branching-demo"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const { buildRuntimeAssessmentBundle } = await import("@lxpack/validators");
    const assessmentBundle = await buildRuntimeAssessmentBundle(
      fixturePath("branching-demo"),
      loaded.manifest,
    );

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-scorm2004-keys-"));
    const zipPath = join(outDir, "branching.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("branching-demo"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "scorm2004",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    const introSco = await zip.file("sco/intro/index.html")?.async("string");
    const quizSco = await zip.file("sco/final_quiz/index.html")?.async("string");
    expect(introSco).not.toContain('"answerKeys"');
    expect(introSco).not.toMatch(/"assessments":\{/);
    expect(introSco).not.toContain('"assessmentFeedback"');
    expect(introSco).not.toContain("What does LXPack compile?");
    expect(quizSco).toContain('"answerKeys"');
    expect(quizSco).toMatch(/"assessments":\{/);
    expect(quizSco).toContain('"final_quiz"');
    expect(quizSco).toContain("What does LXPack compile?");
    expect(introSco).toContain('"baseUrl":"../.."');
  });

  it("creates xapi zip with tincan.xml and activityIri in index", async () => {
    const loaded = await loadManifest(fixturePath("xapi-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const xapiBundle = await buildRuntimeAssessmentBundle(
      fixturePath("xapi-valid"),
      loaded.manifest,
    );

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-xapi-"));
    const zipPath = join(outDir, "course-xapi.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("xapi-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "xapi",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: xapiBundle,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("tincan.xml")).toBeTruthy();
    const index = await zip.file("index.html")!.async("string");
    expect(index).toContain('"mode":"xapi"');
    expect(index).toContain("https://example.test/courses/xapi-valid");
  });

  it("creates xapi zip with optional components bundle", async () => {
    const loaded = await loadManifest(fixturePath("xapi-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const xapiBundle = await buildRuntimeAssessmentBundle(
      fixturePath("xapi-valid"),
      loaded.manifest,
    );
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-xapi-comp-"));
    const zipPath = join(outDir, "course-xapi-comp.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("xapi-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "xapi",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: xapiBundle,
      componentsBundleJs: "window.__LXPACK_COMPONENTS__={};",
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeTruthy();
    expect(zip.file("tincan.xml")).toBeTruthy();
  });

  it("throws CoursePackagingError when assessments exist but bundle is missing", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-no-bundle-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    await expect(
      packageCourse({
        courseDir: fixturePath("minimal-valid"),
        manifest: manifest.manifest,
        outputPath: zipPath,
        target: "scorm12",
        runtimeClientJs: RUNTIME_JS,
        runtimeCss: RUNTIME_CSS,
      }),
    ).rejects.toThrow(/Assessment bundle is required/);
  });

  it("throws CoursePackagingError when xapi export lacks activityIri", async () => {
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-xapi-missing-iri-"));
    const zipPath = join(outDir, "course.zip");
    outputPaths.push(outDir);

    await expect(
      packageCourse({
        courseDir: fixturePath("minimal-valid"),
        manifest: loaded.manifest,
        outputPath: zipPath,
        target: "xapi",
        runtimeClientJs: RUNTIME_JS,
        runtimeCss: RUNTIME_CSS,
        assessmentBundle: minimalAssessmentBundle,
      }),
    ).rejects.toThrow(CoursePackagingError);
  });

  it("creates cmi5 zip with cmi5.xml", async () => {
    const loaded = await loadManifest(fixturePath("xapi-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const xapiBundle = await buildRuntimeAssessmentBundle(
      fixturePath("xapi-valid"),
      loaded.manifest,
    );

    const outDir = await mkdtemp(join(tmpdir(), "lxpack-cmi5-"));
    const zipPath = join(outDir, "course-cmi5.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("xapi-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "cmi5",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: xapiBundle,
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("cmi5.xml")).toBeTruthy();
    const index = await zip.file("index.html")!.async("string");
    expect(index).toContain('"mode":"cmi5"');
  });

  it("creates cmi5 zip with optional components bundle", async () => {
    const loaded = await loadManifest(fixturePath("xapi-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const xapiBundle = await buildRuntimeAssessmentBundle(
      fixturePath("xapi-valid"),
      loaded.manifest,
    );
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-cmi5-comp-"));
    const zipPath = join(outDir, "course-cmi5-comp.zip");
    outputPaths.push(outDir);

    await packageCourse({
      courseDir: fixturePath("xapi-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "cmi5",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: xapiBundle,
      componentsBundleJs: "window.__LXPACK_COMPONENTS__={};",
    });

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    expect(zip.file("lxpack-components.js")).toBeTruthy();
    expect(zip.file("cmi5.xml")).toBeTruthy();
  });

  it("packages spa-valid fixture as SCORM 1.2 zip including SPA assets", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-spa-valid-"));
    const zipPath = join(outDir, "spa-valid.zip");
    outputPaths.push(outDir);

    const loaded = await loadManifest(fixturePath("spa-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const spaBundle = await buildRuntimeAssessmentBundle(
      fixturePath("spa-valid"),
      loaded.manifest,
    );
    const { clientJs, css } = await loadBuiltRuntime();

    const result = await packageCourse({
      courseDir: fixturePath("spa-valid"),
      manifest: loaded.manifest,
      outputPath: zipPath,
      target: "scorm12",
      runtimeClientJs: clientJs,
      runtimeCss: css,
      assessmentBundle: spaBundle,
    });

    expect(result.outputPath).toBe(zipPath);
    const zip = await JSZip.loadAsync(await readFile(zipPath));
    const names = Object.keys(zip.files);
    expect(names.some((n) => n.includes("spa/lessons/spa-lesson/index.html"))).toBe(
      true,
    );
    expect(names).not.toContain("lessonkit.json");
  });
});

describe("packageStandaloneDir", () => {
  it("writes standalone directory without imsmanifest.xml", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-standalone-dir-"));
    const loaded = await loadManifest(fixturePath("minimal-valid"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");

    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      loaded.manifest,
    );
    const result = await packageStandaloneDir({
      courseDir: fixturePath("minimal-valid"),
      manifest: loaded.manifest,
      outputDir: outDir,
      target: "standalone",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: bundle,
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
    const bundle = await buildRuntimeAssessmentBundle(
      fixturePath("minimal-valid"),
      loaded.manifest,
    );

    const result = await packageStandaloneDir({
      courseDir: fixturePath("minimal-valid"),
      manifest: loaded.manifest,
      outputDir: outDir,
      target: "scorm12",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: bundle,
    });

    expect(result.outputDir).toBe(outDir);
    expect(result.fileCount).toBeGreaterThan(4);

    const index = await readFile(join(outDir, "index.html"), "utf-8");
    expect(index).toContain("lxpack-runtime.js");

    const ims = await readFile(join(outDir, "imsmanifest.xml"), "utf-8");
    expect(ims).toContain("1.2");

    await rm(outDir, { recursive: true, force: true });
  });

  it("writes SCORM 2004 multi-SCO directory layout", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "lxpack-scorm2004-dir-"));
    const loaded = await loadManifest(fixturePath("branching-demo"));
    if (Array.isArray(loaded)) throw new Error("fixture failed");
    const branchingBundle = await buildRuntimeAssessmentBundle(
      fixturePath("branching-demo"),
      loaded.manifest,
    );

    const result = await packageScorm2004Dir({
      courseDir: fixturePath("branching-demo"),
      manifest: loaded.manifest,
      outputDir: outDir,
      target: "scorm2004",
      runtimeClientJs: RUNTIME_JS,
      runtimeCss: RUNTIME_CSS,
      assessmentBundle: branchingBundle,
    });

    expect(result.outputDir).toBe(outDir);
    expect(result.fileCount).toBeGreaterThan(5);
    const introSco = await readFile(
      join(outDir, "sco/intro/index.html"),
      "utf-8",
    );
    expect(introSco).toContain('"mode":"scorm2004"');
    expect(introSco).toContain('"baseUrl":"../.."');
    const ims = await readFile(join(outDir, "imsmanifest.xml"), "utf-8");
    expect(ims).toContain("2004 4th Edition");
    await rm(outDir, { recursive: true, force: true });
  });
});
