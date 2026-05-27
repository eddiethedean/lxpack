import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { validateInteractionTree } from "./course-extras.js";
import type { Lesson } from "../schemas.js";
import { resolveCoursePath } from "../course-paths.js";
import {
  assertPackagableFile,
  normalizeLogicalCourseRel,
} from "../packagable-path.js";
import type { ValidationIssue } from "../validate.js";
import { validateHtmlLessonPath } from "./lesson-html.js";

/** Detect SPA scripts that call lxpack on the iframe window instead of the parent shell. */
export function warnDirectLxpackApiInSpaHtml(
  html: string,
  issuePath: string,
): ValidationIssue | null {
  if (
    /window\.parent\.lxpackBridge|parent\.lxpackBridge/.test(html) ||
    /window\.parent\.lxpack|parent\.lxpack/.test(html)
  ) {
    return null;
  }
  const usesDirectApi =
    /window\.lxpack\b/.test(html) ||
    /window\.lxpackBridge\b/.test(html) ||
    /\blxpack\s*[?.]\s*(?:track|setVariable|getVariable|submitAssessment)\b/.test(
      html,
    );
  if (!usesDirectApi) {
    return null;
  }
  return {
    path: issuePath,
    message:
      "index.html appears to call lxpack on the SPA iframe window; use window.parent.lxpackBridge.v1 (preferred) or window.parent.lxpack (SPAs run inside an iframe)",
    severity: "warning",
  };
}

export async function validateSpaLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "spa" }>,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // For now, reuse the same safe path rules as HTML interaction lessons.
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
      message: `SPA lesson directory not found: ${lesson.path}`,
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
      message: `SPA lesson path is not a directory: ${lesson.path}`,
      severity: "error",
    });
    return issues;
  }

  const indexPath = join(resolved.path, "index.html");
  if (!existsSync(indexPath)) {
    issues.push({
      path: `lessons.${lesson.id}.path`,
      message: `SPA lesson missing index.html: ${lesson.path}`,
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
  const apiWarning = warnDirectLxpackApiInSpaHtml(
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

