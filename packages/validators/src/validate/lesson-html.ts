import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Lesson } from "../schemas.js";
import {
  assertResolvedPathContained,
  resolveCoursePath,
} from "../course-paths.js";
import type { ValidationIssue } from "../validate.js";

export function validateHtmlLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "html" }>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const resolved = resolveCoursePath(courseDir, lesson.path);
  if (!resolved.ok) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: resolved.message,
      severity: "error",
    });
    return issues;
  }
  if (!existsSync(resolved.path)) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: `HTML interaction directory not found: ${lesson.path}`,
      severity: "error",
    });
    return issues;
  }
  const contained = assertResolvedPathContained(courseDir, resolved.path);
  if (!contained.ok) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: contained.message,
      severity: "error",
    });
    return issues;
  }
  const stat = statSync(resolved.path);
  if (!stat.isDirectory()) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: `HTML interaction path is not a directory: ${lesson.path}`,
      severity: "error",
    });
    return issues;
  }
  const indexPath = join(resolved.path, "index.html");
  if (!existsSync(indexPath)) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: `HTML interaction missing index.html: ${lesson.path}`,
      severity: "error",
    });
    return issues;
  }
  const indexContained = assertResolvedPathContained(courseDir, indexPath);
  if (!indexContained.ok) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: indexContained.message,
      severity: "error",
    });
    return issues;
  }
  if (!statSync(indexPath).isFile()) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: `index.html is not a file: ${lesson.path}/index.html`,
      severity: "error",
    });
  }
  return issues;
}
