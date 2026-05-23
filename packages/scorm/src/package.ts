import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import JSZip from "jszip";
import type { CourseManifest } from "@lxpack/validators";
import { generateImsManifest } from "./manifest.js";
import { buildIndexHtml } from "./build-html.js";

export type ExportTarget = "scorm12" | "standalone";

export interface PackageOptions {
  courseDir: string;
  manifest: CourseManifest;
  outputPath: string;
  target: ExportTarget;
  runtimeClientJs: string;
  runtimeCss: string;
}

const SKIP_FILES = new Set([
  "course.yaml",
  "lxpack.config.ts",
  "lxpack.config.json",
]);

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
      if (SKIP_FILES.has(rel) || rel.startsWith(".lxpack")) {
        continue;
      }
      if (rel === "index.html") {
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

export async function packageCourse(
  options: PackageOptions,
): Promise<{ outputPath: string; fileCount: number }> {
  const { courseDir, manifest, outputPath, target, runtimeClientJs, runtimeCss } =
    options;

  const zip = new JSZip();
  const mode = target === "scorm12" ? "scorm12" : "standalone";
  const courseFiles = await collectFiles(courseDir, courseDir);

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    zip.file(file.path, content);
  }

  const indexHtml = buildIndexHtml({ manifest, runtimeCss, mode });
  zip.file("index.html", indexHtml);
  zip.file("lxpack-runtime.js", runtimeClientJs);

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

  const { writeFile } = await import("node:fs/promises");
  await writeFile(outputPath, buffer);

  return {
    outputPath,
    fileCount: Object.keys(zip.files).length,
  };
}

export async function packageStandaloneDir(
  options: Omit<PackageOptions, "outputPath"> & { outputDir: string },
): Promise<{ outputDir: string; fileCount: number }> {
  const { courseDir, manifest, outputDir, target, runtimeClientJs, runtimeCss } =
    options;

  const { mkdir, writeFile, cp } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");

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

  const indexHtml = buildIndexHtml({ manifest, runtimeCss, mode });
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
