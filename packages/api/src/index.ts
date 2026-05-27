import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  validateCourse as validateCourseInternal,
  buildRuntimeAssessmentBundleFromParsed,
  type CourseManifest,
  type ValidationIssue,
} from "@lxpack/validators";
import {
  courseSlug,
  packageCourse,
  packageScorm2004Dir,
  packageStandaloneDir,
  type ExportTarget,
} from "@lxpack/scorm";
import { readComponentsBundle, readRuntimeBundle } from "./bundle-io.js";
import { resolveBuildOutputPath } from "./output-paths.js";

export type { ExportTarget } from "@lxpack/scorm";
export type { CourseManifest, ValidationIssue } from "@lxpack/validators";

export interface ValidateCourseOptions {
  courseDir: string;
  target?: ExportTarget;
}

export type ValidateCourseResult =
  | {
      ok: true;
      manifest: CourseManifest;
      issues: ValidationIssue[];
    }
  | {
      ok: false;
      manifest?: CourseManifest;
      issues: ValidationIssue[];
    };

export async function validateCourse(
  options: ValidateCourseOptions,
): Promise<ValidateCourseResult> {
  const validation = await validateCourseInternal(options.courseDir, {
    exportTarget: options.target,
  });

  const ok = validation.valid && Boolean(validation.manifest);
  if (!validation.manifest) {
    return { ok: false, issues: validation.issues };
  }

  return {
    ok,
    manifest: validation.manifest,
    issues: validation.issues,
  };
}

export interface BuildCourseOptions {
  courseDir: string;
  target: ExportTarget;
  /** Output zip file path (zip builds) or output directory (dir builds). */
  output?: string;
  /** If true, writes a directory instead of a zip. */
  dir?: boolean;
  /** Base output folder under courseDir when output is omitted. */
  outputBaseDir?: string;
}

export type BuildCourseResult =
  | {
      ok: true;
      target: ExportTarget;
      outputPath?: string;
      outputDir?: string;
      fileCount: number;
      manifest: CourseManifest;
      issues: ValidationIssue[];
    }
  | {
      ok: false;
      target: ExportTarget;
      manifest?: CourseManifest;
      issues: ValidationIssue[];
    };

export async function buildCourse(
  options: BuildCourseOptions,
): Promise<BuildCourseResult> {
  const validation = await validateCourseInternal(options.courseDir, {
    exportTarget: options.target,
  });

  if (!validation.valid || !validation.manifest) {
    return {
      ok: false,
      target: options.target,
      manifest: validation.manifest,
      issues: validation.issues,
    };
  }

  const assessmentBundle = buildRuntimeAssessmentBundleFromParsed(
    validation.parsedAssessments ?? new Map(),
  );

  const [{ clientJs, css }, componentsBundleJs] = await Promise.all([
    readRuntimeBundle(),
    readComponentsBundle(),
  ]);

  const manifest = validation.manifest;
  const slug = courseSlug(manifest);
  const outputBase = options.outputBaseDir ?? ".lxpack";
  const outputRoot = resolveBuildOutputPath(options.courseDir, outputBase);
  await mkdir(outputRoot, { recursive: true });

  const packageOptions = {
    courseDir: options.courseDir,
    manifest,
    target: options.target,
    runtimeClientJs: clientJs,
    runtimeCss: css,
    componentsBundleJs,
    assessmentBundle,
  };

  if (options.dir) {
    const outputDir = options.output
      ? resolveBuildOutputPath(options.courseDir, options.output)
      : join(outputRoot, options.target);
    const result =
      options.target === "scorm2004"
        ? await packageScorm2004Dir({ ...packageOptions, outputDir })
        : await packageStandaloneDir({ ...packageOptions, outputDir });
    return {
      ok: true,
      target: options.target,
      outputDir: result.outputDir,
      fileCount: result.fileCount,
      manifest,
      issues: validation.issues,
    };
  }

  const defaultName =
    options.target === "standalone"
      ? `${slug}-standalone.zip`
      : options.target === "scorm2004"
        ? `${slug}-scorm2004.zip`
        : options.target === "xapi"
          ? `${slug}-xapi.zip`
          : options.target === "cmi5"
            ? `${slug}-cmi5.zip`
            : `${slug}-scorm12.zip`;
  const outputPath = options.output
    ? resolveBuildOutputPath(options.courseDir, options.output)
    : join(outputRoot, defaultName);

  const result = await packageCourse({ ...packageOptions, outputPath });
  return {
    ok: true,
    target: options.target,
    outputPath: result.outputPath,
    fileCount: result.fileCount,
    manifest,
    issues: validation.issues,
  };
}

