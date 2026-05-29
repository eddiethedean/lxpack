import { rm } from "node:fs/promises";
import {
  materializeLessonkitProject,
  resolvePackageAssessments,
  type LessonkitInterchangeV1,
  type ValidationIssue,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import { buildCourse, type BuildCourseResult } from "./build-course.js";

export interface PackageLessonkitOptions {
  interchange: LessonkitInterchangeV1;
  /** SPA lesson id → absolute path to folder with index.html */
  spaDirs: Record<string, string>;
  target: ExportTarget;
  assessments?: unknown[];
  output?: string;
  dir?: boolean;
  courseDir?: string;
  outputBaseDir?: string;
  writeAuthoringFiles?: boolean;
  debug?: boolean;
}

export type PackageLessonkitResult =
  | (Extract<BuildCourseResult, { ok: true }> & { courseDir: string })
  | {
      ok: false;
      target: ExportTarget;
      courseDir?: string;
      issues: ValidationIssue[];
    };

export async function packageLessonkit(
  options: PackageLessonkitOptions,
): Promise<PackageLessonkitResult> {
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
      target: options.target,
      courseDir: materialized.courseDir,
      issues: materialized.issues,
    };
  }

  const courseDir = materialized.courseDir;
  const assessments = resolvePackageAssessments(
    options.interchange,
    options.assessments,
  );

  try {
    const built = await buildCourse({
      courseDir,
      target: options.target,
      output: options.output,
      dir: options.dir,
      outputBaseDir: options.outputBaseDir,
      assessments,
    });

    if (!built.ok) {
      if (!options.debug && !options.courseDir) {
        await rm(courseDir, { recursive: true, force: true }).catch(() => {});
      }
      return {
        ok: false,
        target: options.target,
        courseDir: options.debug || options.courseDir ? courseDir : undefined,
        issues: built.issues,
      };
    }

    return { ...built, courseDir };
  } catch (err) {
    if (!options.debug && !options.courseDir) {
      await rm(courseDir, { recursive: true, force: true }).catch(() => {});
    }
    return {
      ok: false,
      target: options.target,
      courseDir: options.debug || options.courseDir ? courseDir : undefined,
      issues: [
        {
          path: "packageLessonkit",
          message: err instanceof Error ? err.message : String(err),
          severity: "error",
        },
      ],
    };
  }
}
