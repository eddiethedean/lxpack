import { readFile, readdir, writeFile, mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import JSZip from "jszip";
import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { generateImsManifest } from "./manifest.js";
import { buildIndexHtml, buildScoIndexHtml } from "./build-html.js";
import { listCourseActivities } from "./activities.js";
import {
  buildScorm2004ManifestFiles,
  generateScorm2004Manifest,
} from "./scorm2004-manifest.js";

export type ExportTarget = "scorm12" | "scorm2004" | "standalone";

export interface PackageOptions {
  courseDir: string;
  manifest: CourseManifest;
  outputPath: string;
  target: ExportTarget;
  runtimeClientJs: string;
  runtimeCss: string;
  componentsBundleJs?: string;
  assessmentBundle?: RuntimeAssessmentBundle;
}

const SKIP_FILES = new Set([
  "course.yaml",
  "lxpack.config.ts",
  "lxpack.config.json",
]);

export function shouldSkipCourseFile(rel: string): boolean {
  if (SKIP_FILES.has(rel) || rel.startsWith(".lxpack")) {
    return true;
  }
  if (rel === "index.html") {
    return true;
  }
  if (rel.startsWith("assessments/")) {
    return true;
  }
  return false;
}

export async function collectFiles(
  dir: string,
  baseDir: string,
): Promise<Array<{ path: string; fullPath: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ path: string; fullPath: string }> = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith(".") || entry.name === "node_modules") {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, baseDir)));
    } else if (entry.isFile()) {
      const rel = relative(baseDir, fullPath).replace(/\\/g, "/");
      if (shouldSkipCourseFile(rel)) {
        continue;
      }
      files.push({ path: rel, fullPath });
    }
  }

  return files;
}

export function buildManifestFileList(
  courseFiles: Array<{ path: string }>,
): string[] {
  return ["index.html", "lxpack-runtime.js", ...courseFiles.map((f) => f.path)];
}

export async function packageScorm2004(
  options: PackageOptions,
): Promise<{ outputPath: string; fileCount: number }> {
  const {
    courseDir,
    manifest,
    outputPath,
    runtimeClientJs,
    runtimeCss,
    componentsBundleJs,
    assessmentBundle,
  } = options;

  const zip = new JSZip();
  const courseFiles = await collectFiles(courseDir, courseDir);

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    zip.file(file.path, content);
  }

  zip.file("lxpack-runtime.js", runtimeClientJs);
  if (componentsBundleJs) {
    zip.file("lxpack-components.js", componentsBundleJs);
  }

  const activities = listCourseActivities(manifest);
  for (const activity of activities) {
    const html = buildScoIndexHtml({
      manifest,
      runtimeCss,
      mode: "scorm2004",
      activityId: activity.id,
      assessmentBundle,
      componentsScript: componentsBundleJs ? "../../lxpack-components.js" : undefined,
    });
    zip.file(`sco/${activity.id}/index.html`, html);
  }

  const manifestFiles = buildScorm2004ManifestFiles(
    manifest,
    courseFiles.map((f) => f.path),
  );
  zip.file("imsmanifest.xml", generateScorm2004Manifest(manifest, manifestFiles));

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  await writeFile(outputPath, buffer);

  return {
    outputPath,
    fileCount: Object.keys(zip.files).length,
  };
}

export async function packageCourse(
  options: PackageOptions,
): Promise<{ outputPath: string; fileCount: number }> {
  if (options.target === "scorm2004") {
    return packageScorm2004(options);
  }

  const {
    courseDir,
    manifest,
    outputPath,
    target,
    runtimeClientJs,
    runtimeCss,
    assessmentBundle,
    componentsBundleJs,
  } = options;

  const zip = new JSZip();
  const mode = target === "scorm12" ? "scorm12" : "standalone";
  const courseFiles = await collectFiles(courseDir, courseDir);

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    zip.file(file.path, content);
  }

  const indexHtml = buildIndexHtml({
    manifest,
    runtimeCss,
    mode,
    assessmentBundle,
    componentsScript: componentsBundleJs ? "./lxpack-components.js" : undefined,
  });
  zip.file("index.html", indexHtml);
  zip.file("lxpack-runtime.js", runtimeClientJs);
  if (componentsBundleJs) {
    zip.file("lxpack-components.js", componentsBundleJs);
  }

  if (target === "scorm12") {
    const manifestFiles = buildManifestFileList(courseFiles);
    zip.file(
      "imsmanifest.xml",
      generateImsManifest(manifest, manifestFiles),
    );
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  await writeFile(outputPath, buffer);

  return {
    outputPath,
    fileCount: Object.keys(zip.files).length,
  };
}

export async function packageStandaloneDir(
  options: Omit<PackageOptions, "outputPath"> & { outputDir: string },
): Promise<{ outputDir: string; fileCount: number }> {
  const {
    courseDir,
    manifest,
    outputDir,
    target,
    runtimeClientJs,
    runtimeCss,
    assessmentBundle,
  } = options;

  await mkdir(outputDir, { recursive: true });

  const mode = target === "scorm12" ? "scorm12" : "standalone";
  const courseFiles = await collectFiles(courseDir, courseDir);
  let fileCount = 0;

  for (const file of courseFiles) {
    const dest = join(outputDir, file.path);
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }
    await cp(file.fullPath, dest);
    fileCount++;
  }

  const indexHtml = buildIndexHtml({
    manifest,
    runtimeCss,
    mode,
    assessmentBundle,
  });
  await writeFile(join(outputDir, "index.html"), indexHtml);
  await writeFile(join(outputDir, "lxpack-runtime.js"), runtimeClientJs);
  fileCount += 2;

  if (target === "scorm12") {
    const manifestFiles = buildManifestFileList(courseFiles);
    await writeFile(
      join(outputDir, "imsmanifest.xml"),
      generateImsManifest(manifest, manifestFiles),
    );
    fileCount++;
  }

  return { outputDir, fileCount };
}
