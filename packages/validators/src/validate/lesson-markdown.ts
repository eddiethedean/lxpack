import { existsSync, statSync } from "node:fs";
import type { Lesson } from "../schemas.js";
import {
  assertResolvedPathContained,
  resolveCoursePath,
} from "../course-paths.js";
import type { ValidationIssue } from "../validate.js";

export function validateMarkdownLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "markdown" }>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const resolved = resolveCoursePath(courseDir, lesson.file);
  if (!resolved.ok) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: resolved.message,
      severity: "error",
    });
    return issues;
  }
  if (!existsSync(resolved.path)) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: `Lesson file not found: ${lesson.file}`,
      severity: "error",
    });
    return issues;
  }
  const contained = assertResolvedPathContained(courseDir, resolved.path);
  if (!contained.ok) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: contained.message,
      severity: "error",
    });
    return issues;
  }
  const stat = statSync(resolved.path);
  if (!stat.isFile()) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: `Lesson path is not a file: ${lesson.file}`,
      severity: "error",
    });
  }
  return issues;
}
