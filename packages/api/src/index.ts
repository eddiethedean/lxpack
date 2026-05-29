import {
  validateCourseWithInterchange,
  type CourseManifest,
  type ValidationIssue,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";
import { readComponentsBundle } from "./bundle-io.js";
import { buildCourse } from "./build-course.js";
import { packageLessonkit } from "./package-lessonkit.js";

export type { ExportTarget } from "@lxpack/scorm";
export type {
  CourseManifest,
  LessonkitInterchangeV1,
  ValidationIssue,
} from "@lxpack/validators";
export type { BuildCourseOptions, BuildCourseResult } from "./build-course.js";
export type {
  PackageLessonkitOptions,
  PackageLessonkitResult,
} from "./package-lessonkit.js";
export { buildCourse, packageLessonkit };

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
  const componentsBundleJs = await readComponentsBundle();
  const validation = await validateCourseWithInterchange(options.courseDir, {
    exportTarget: options.target,
    hasComponentsBundle: componentsBundleJs !== undefined,
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
