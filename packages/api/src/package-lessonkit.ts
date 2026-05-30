import { rm } from "node:fs/promises";
import {
  materializeLessonkitProject,
  resolvePackageAssessments,
  type LessonkitInterchangeV1,
  type ValidationIssue,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import { buildCourse, type BuildCourseResult } from "./build-course.js";
import {
  loadLxpackConfig,
  resolveDefaultExportTarget,
  resolveOutputBaseDir,
} from "./lxpack-config.js";

export interface PackageLessonkitOptions {
  interchange: LessonkitInterchangeV1;
  /** SPA lesson id → absolute path to folder with index.html */
  spaDirs: Record<string, string>;
  /** Export target; when omitted, uses lxpack.config.json beside configDir */
  target?: ExportTarget;
  /** Directory containing lxpack.config.json (defaults to outputAnchorDir or cwd) */
  configDir?: string;
  assessments?: unknown[];
  output?: string;
  dir?: boolean;
  courseDir?: string;
  outputBaseDir?: string;
  /** Resolve relative output paths against this directory (defaults to process.cwd()). */
  outputAnchorDir?: string;
  writeAuthoringFiles?: boolean;
  debug?: boolean;
}

export type PackageLessonkitResult =
  | (Extract<BuildCourseResult, { ok: true }> & { courseDir?: string })
  | {
      ok: false;
      target: ExportTarget;
      courseDir?: string;
      issues: ValidationIssue[];
    };

export async function packageLessonkit(
  options: PackageLessonkitOptions,
): Promise<PackageLessonkitResult> {
  const configDir =
    options.configDir ?? options.outputAnchorDir ?? process.cwd();
  const config = await loadLxpackConfig(configDir);
  const target = options.target ?? resolveDefaultExportTarget(config);
  const outputBaseDir = resolveOutputBaseDir(config, options.outputBaseDir);

  const materialized = await materializeLessonkitProject({
    interchange: options.interchange,
    spaDirs: options.spaDirs,
    courseDir: options.courseDir,
    writeAuthoringFiles: options.writeAuthoringFiles,
    debug: options.debug,
  });

  if (!materialized.ok) {
    return {
      ok: false,
      target,
      courseDir: materialized.courseDir,
      issues: materialized.issues,
    };
  }

  const courseDir = materialized.courseDir;
  const keepStaging = Boolean(options.debug || options.courseDir);
  const assessments = resolvePackageAssessments(
    options.interchange,
    options.assessments,
  );

  try {
    const built = await buildCourse({
      courseDir,
      target,
      output: options.output,
      dir: options.dir,
      outputBaseDir,
      outputAnchorDir: options.outputAnchorDir ?? process.cwd(),
      assessments,
      interchange: options.interchange,
    });

    if (!built.ok) {
      return {
        ok: false,
        target,
        courseDir: keepStaging ? courseDir : undefined,
        issues: built.issues,
      };
    }

    return {
      ...built,
      courseDir: keepStaging ? courseDir : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      target,
      courseDir: keepStaging ? courseDir : undefined,
      issues: [
        {
          path: "packageLessonkit",
          message: err instanceof Error ? err.message : String(err),
          severity: "error",
        },
      ],
    };
  } finally {
    if (!keepStaging) {
      await rm(courseDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
