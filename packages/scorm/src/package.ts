import { readFile, readdir, writeFile, mkdir, lstat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { assertResolvedPathContained } from "@lxpack/validators";
import JSZip from "jszip";
import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { sliceAssessmentBundleForActivity } from "./assessment-slice.js";
import { generateImsManifest } from "./manifest.js";
import { buildIndexHtml, buildScoIndexHtml } from "./build-html.js";
import { listCourseActivities } from "./activities.js";
import {
  buildScorm2004ManifestFiles,
  generateScorm2004Manifest,
} from "./scorm2004-manifest.js";
import { generateTincanXml } from "@lxpack/xapi";
import { generateCmi5Xml } from "@lxpack/cmi5";
import { getCourseActivityIri } from "@lxpack/validators";

export type ExportTarget =
  | "scorm12"
  | "scorm2004"
  | "standalone"
  | "xapi"
  | "cmi5";

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

const BLOCKED_PACKAGING_SEGMENTS = new Set([".git", ".env"]);

export class CoursePackagingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoursePackagingError";
  }
}

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
  for (const segment of rel.split("/")) {
    if (segment.startsWith(".") || BLOCKED_PACKAGING_SEGMENTS.has(segment)) {
      return true;
    }
  }
  return false;
}

function assertPackagablePath(courseDir: string, fullPath: string): void {
  const contained = assertResolvedPathContained(courseDir, fullPath);
  if (!contained.ok) {
    throw new CoursePackagingError(contained.message);
  }
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
    if (BLOCKED_PACKAGING_SEGMENTS.has(entry.name)) {
      continue;
    }

    const stat = await lstat(fullPath);
    if (stat.isSymbolicLink()) {
      const rel = relative(baseDir, fullPath).replace(/\\/g, "/");
      throw new CoursePackagingError(
        `Symlinks are not allowed in course packages: ${rel}`,
      );
    }

    assertPackagablePath(baseDir, fullPath);

    if (stat.isDirectory()) {
      files.push(...(await collectFiles(fullPath, baseDir)));
    } else if (stat.isFile()) {
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

export interface PackageSink {
  writeFile(relPath: string, content: string | Buffer): Promise<void>;
}

async function writeSingleScoArtifacts(
  options: Omit<PackageOptions, "outputPath"> & {
    writeFile: PackageSink["writeFile"];
  },
): Promise<{ fileCount: number }> {
  const {
    courseDir,
    manifest,
    target,
    runtimeClientJs,
    runtimeCss,
    assessmentBundle,
    componentsBundleJs,
    writeFile: writeArtifact,
  } = options;

  const mode = target === "scorm12" ? "scorm12" : "standalone";
  const courseFiles = await collectFiles(courseDir, courseDir);
  let fileCount = 0;

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    await writeArtifact(file.path, content);
    fileCount++;
  }

  const indexHtml = buildIndexHtml({
    manifest,
    runtimeCss,
    mode,
    assessmentBundle,
    componentsScript: componentsBundleJs ? "./lxpack-components.js" : undefined,
  });
  await writeArtifact("index.html", indexHtml);
  await writeArtifact("lxpack-runtime.js", runtimeClientJs);
  fileCount += 2;

  if (componentsBundleJs) {
    await writeArtifact("lxpack-components.js", componentsBundleJs);
    fileCount++;
  }

  if (target === "scorm12") {
    const manifestFiles = buildManifestFileList(courseFiles);
    await writeArtifact(
      "imsmanifest.xml",
      generateImsManifest(manifest, manifestFiles),
    );
    fileCount++;
  }

  return { fileCount };
}

async function writeXapiOrCmi5Artifacts(
  options: Omit<PackageOptions, "outputPath"> & {
    writeFile: PackageSink["writeFile"];
    target: "xapi" | "cmi5";
  },
): Promise<{ fileCount: number }> {
  const {
    courseDir,
    manifest,
    target,
    runtimeClientJs,
    runtimeCss,
    assessmentBundle,
    componentsBundleJs,
    writeFile: writeArtifact,
  } = options;

  const courseIri = getCourseActivityIri(manifest);
  if (!courseIri) {
    throw new Error(
      "tracking.xapi.activityIri is required for xapi/cmi5 export targets",
    );
  }

  const courseFiles = await collectFiles(courseDir, courseDir);
  let fileCount = 0;

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    await writeArtifact(file.path, content);
    fileCount++;
  }

  const indexHtml = buildIndexHtml({
    manifest,
    runtimeCss,
    mode: target,
    activityIri: courseIri,
    assessmentBundle,
    componentsScript: componentsBundleJs ? "./lxpack-components.js" : undefined,
  });
  await writeArtifact("index.html", indexHtml);
  await writeArtifact("lxpack-runtime.js", runtimeClientJs);
  fileCount += 2;

  if (componentsBundleJs) {
    await writeArtifact("lxpack-components.js", componentsBundleJs);
    fileCount++;
  }

  if (target === "xapi") {
    await writeArtifact("tincan.xml", generateTincanXml(manifest, courseIri));
    fileCount++;
  } else {
    await writeArtifact("cmi5.xml", generateCmi5Xml(manifest, courseIri));
    fileCount++;
  }

  return { fileCount };
}

export async function assemblePackage(
  options: Omit<PackageOptions, "outputPath">,
  sink: PackageSink,
): Promise<{ fileCount: number }> {
  if (options.target === "scorm2004") {
    return writeScorm2004Artifacts({ ...options, writeFile: sink.writeFile });
  }
  if (options.target === "xapi" || options.target === "cmi5") {
    return writeXapiOrCmi5Artifacts({
      ...options,
      writeFile: sink.writeFile,
      target: options.target,
    });
  }
  return writeSingleScoArtifacts({ ...options, writeFile: sink.writeFile });
}

async function writeScorm2004Artifacts(
  options: Omit<PackageOptions, "outputPath"> & {
    writeFile: (relPath: string, content: string | Buffer) => Promise<void>;
  },
): Promise<{ fileCount: number }> {
  const {
    courseDir,
    manifest,
    runtimeClientJs,
    runtimeCss,
    componentsBundleJs,
    assessmentBundle,
    writeFile: writeArtifact,
  } = options;

  const courseFiles = await collectFiles(courseDir, courseDir);
  let fileCount = 0;

  for (const file of courseFiles) {
    const content = await readFile(file.fullPath);
    await writeArtifact(file.path, content);
    fileCount++;
  }

  await writeArtifact("lxpack-runtime.js", runtimeClientJs);
  fileCount++;

  if (componentsBundleJs) {
    await writeArtifact("lxpack-components.js", componentsBundleJs);
    fileCount++;
  }

  const activities = listCourseActivities(manifest);
  for (const activity of activities) {
    const scoBundle =
      assessmentBundle != null
        ? sliceAssessmentBundleForActivity(
            assessmentBundle,
            activity.id,
            activity.kind,
          )
        : undefined;
    const html = buildScoIndexHtml({
      manifest,
      runtimeCss,
      mode: "scorm2004",
      activityId: activity.id,
      assessmentBundle: scoBundle,
      componentsScript: componentsBundleJs ? "../../lxpack-components.js" : undefined,
    });
    await writeArtifact(`sco/${activity.id}/index.html`, html);
    fileCount++;
  }

  const manifestFiles = buildScorm2004ManifestFiles(
    manifest,
    courseFiles.map((f) => f.path),
    Boolean(componentsBundleJs),
  );
  await writeArtifact(
    "imsmanifest.xml",
    generateScorm2004Manifest(manifest, manifestFiles, {
      hasComponentsBundle: Boolean(componentsBundleJs),
    }),
  );
  fileCount++;

  return { fileCount };
}

export async function packageScorm2004(
  options: PackageOptions,
): Promise<{ outputPath: string; fileCount: number }> {
  const { outputPath, ...rest } = options;
  const zip = new JSZip();

  const { fileCount } = await writeScorm2004Artifacts({
    ...rest,
    writeFile: async (relPath, content) => {
      zip.file(relPath, content);
    },
  });

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  await writeFile(outputPath, buffer);

  return {
    outputPath,
    fileCount: Object.keys(zip.files).length || fileCount,
  };
}

export async function packageScorm2004Dir(
  options: Omit<PackageOptions, "outputPath"> & { outputDir: string },
): Promise<{ outputDir: string; fileCount: number }> {
  const { outputDir, ...rest } = options;

  await mkdir(outputDir, { recursive: true });

  const { fileCount } = await writeScorm2004Artifacts({
    ...rest,
    writeFile: async (relPath, content) => {
      const dest = join(outputDir, relPath);
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true });
      }
      await writeFile(dest, content);
    },
  });

  return { outputDir, fileCount };
}

export async function packageCourse(
  options: PackageOptions,
): Promise<{ outputPath: string; fileCount: number }> {
  if (options.target === "scorm2004") {
    return packageScorm2004(options);
  }

  const { outputPath, ...rest } = options;
  const zip = new JSZip();

  const { fileCount } = await assemblePackage(rest, {
    writeFile: async (relPath, content) => {
      zip.file(relPath, content);
    },
  });

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  await writeFile(outputPath, buffer);

  return {
    outputPath,
    fileCount: Object.keys(zip.files).length || fileCount,
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
    componentsBundleJs,
  } = options;

  await mkdir(outputDir, { recursive: true });

  const { fileCount } = await assemblePackage(
    {
      courseDir,
      manifest,
      target,
      runtimeClientJs,
      runtimeCss,
      assessmentBundle,
      componentsBundleJs,
    },
    {
      writeFile: async (relPath, content) => {
        const dest = join(outputDir, relPath);
        const destDir = dirname(dest);
        if (!existsSync(destDir)) {
          await mkdir(destDir, { recursive: true });
        }
        if (typeof content === "string") {
          await writeFile(dest, content);
        } else {
          await writeFile(dest, content);
        }
      },
    },
  );

  return { outputDir, fileCount };
}
