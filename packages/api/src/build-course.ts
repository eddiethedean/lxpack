import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  validateCourseWithInterchange,
  buildRuntimeAssessmentBundleFromParsed,
  buildRuntimeAssessmentBundleFromData,
  type CourseManifest,
  type LessonkitInterchangeV1,
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

export interface BuildCourseOptions {
  courseDir: string;
  target: ExportTarget;
  output?: string;
  dir?: boolean;
  outputBaseDir?: string;
  /** Directory used to resolve relative output paths (defaults to courseDir). */
  outputAnchorDir?: string;
  assessments?: unknown[];
  /** In-memory interchange (restores lessonkit warnings when assessments are injected). */
  interchange?: LessonkitInterchangeV1;
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
  const [{ clientJs, css }, componentsBundleJs] = await Promise.all([
    readRuntimeBundle(),
    readComponentsBundle(),
  ]);

  const validation = await validateCourseWithInterchange(options.courseDir, {
    exportTarget: options.target,
    assessmentData: options.assessments,
    interchange: options.interchange,
    hasComponentsBundle: componentsBundleJs !== undefined,
  });

  if (!validation.valid || !validation.manifest) {
    return {
      ok: false,
      target: options.target,
      manifest: validation.manifest,
      issues: validation.issues,
    };
  }

  const assessmentInjection =
    options.assessments != null
      ? buildRuntimeAssessmentBundleFromData(
          validation.manifest,
          options.assessments,
        )
      : null;

  if (assessmentInjection?.issues?.some((i) => i.severity === "error")) {
    return {
      ok: false,
      target: options.target,
      manifest: validation.manifest,
      issues: [...validation.issues, ...assessmentInjection.issues],
    };
  }

  const assessmentBundle =
    assessmentInjection?.bundle ??
    buildRuntimeAssessmentBundleFromParsed(validation.parsedAssessments ?? new Map());

  const manifest = validation.manifest;
  const slug = courseSlug(manifest);
  const outputAnchor = options.outputAnchorDir ?? options.courseDir;
  const outputBase = options.outputBaseDir ?? ".lxpack";
  const outputRoot = resolveBuildOutputPath(outputAnchor, outputBase);
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
      ? resolveBuildOutputPath(outputAnchor, options.output)
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
    ? resolveBuildOutputPath(outputAnchor, options.output)
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
