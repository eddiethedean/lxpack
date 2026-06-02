import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { validateInteractionTree } from "./course-extras.js";
import type { Lesson } from "../schemas.js";
import { resolveCoursePath } from "../course-paths.js";
import { assertPackagableFile, normalizeLogicalCourseRel } from "../packagable-path.js";
import type { ValidationIssue } from "../validate.js";

/** Safe relative path for HTML interaction folders (no quotes, spaces, or `..`). */
export const HTML_LESSON_PATH_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/;

export function validateHtmlLessonPath(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  if (/["'<>]/.test(normalized) || /\s/.test(normalized)) {
    return "HTML interaction path contains invalid characters (quotes, angle brackets, or whitespace)";
  }
  if (normalized.includes("..")) {
    return "HTML interaction path must not contain '..' segments";
  }
  if (!HTML_LESSON_PATH_PATTERN.test(normalized)) {
    return "HTML interaction path must start with a letter and use only letters, numbers, /, _, ., and -";
  }
  return null;
}

/** Detect interaction scripts that call lxpack on the iframe window instead of the parent shell. */
export function warnDirectLxpackApiInInteractionHtml(
  html: string,
  issuePath: string,
): ValidationIssue | null {
  if (/window\.parent\.lxpackBridge|parent\.lxpackBridge/.test(html)) {
    return null;
  }
  if (/window\.parent\.lxpack|parent\.lxpack/.test(html)) {
    return null;
  }
  const usesDirectApi =
    /window\.lxpack\b/.test(html) ||
    /\blxpack\s*[?.]\s*(?:track|setVariable|getVariable|submitAssessment)\b/.test(
      html,
    );
  if (!usesDirectApi) {
    return null;
  }
  return {
    path: issuePath,
    message:
      "index.html appears to call lxpack on the interaction iframe window; use window.parent.lxpack (interactions run inside an iframe)",
    severity: "warning",
  };
}

export async function validateHtmlLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "html" }>,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const pathError = validateHtmlLessonPath(lesson.path);
  if (pathError) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: pathError,
      severity: "error",
    });
    return issues;
  }
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
  const dirPackagable = assertPackagableFile(
    courseDir,
    resolved.path,
    lesson.path,
  );
  if (!dirPackagable.ok) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: dirPackagable.message,
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
  const indexLogical = normalizeLogicalCourseRel(`${lesson.path}/index.html`);
  const indexPackagable = assertPackagableFile(
    courseDir,
    indexPath,
    indexLogical,
  );
  if (!indexPackagable.ok) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: indexPackagable.message,
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
    return issues;
  }

  const indexHtml = readFileSync(indexPath, "utf-8");
  const apiWarning = warnDirectLxpackApiInInteractionHtml(
    indexHtml,
    `lessons.${lesson.id}.path`,
  );
  if (apiWarning) {
    issues.push(apiWarning);
  }

  issues.push(
    ...(await validateInteractionTree(
      courseDir,
      resolved.path,
      `lessons.${lesson.id}.path`,
    )),
  );

  return issues;
}
