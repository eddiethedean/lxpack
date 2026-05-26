import { existsSync, readFileSync, statSync } from "node:fs";
import type { Lesson } from "../schemas.js";
import { resolveCoursePath } from "../course-paths.js";
import { assertPackagableFile } from "../packagable-path.js";
import type { ValidationIssue } from "../validate.js";
import { validateSafeRelativePath } from "../safe-relative-path.js";

export function validateMarkdownLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "markdown" }>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pathError = validateSafeRelativePath(lesson.file);
  if (pathError) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: pathError,
      severity: "error",
    });
    return issues;
  }
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
  const packagable = assertPackagableFile(
    courseDir,
    resolved.path,
    lesson.file,
  );
  if (!packagable.ok) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message: packagable.message,
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
    return issues;
  }

  const content = readFileSync(resolved.path, "utf-8");
  if (
    /\[[^\]]*\]\(\s*javascript:/i.test(content) ||
    /!\[[^\]]*\]\(\s*javascript:/i.test(content)
  ) {
    issues.push({
      path: `lessons.${lesson.id}.file`,
      message:
        "Markdown contains javascript: URI in a link or image; use https: URLs instead",
      severity: "warning",
    });
  }

  return issues;
}
