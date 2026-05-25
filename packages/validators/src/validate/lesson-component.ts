import { existsSync, lstatSync, statSync } from "node:fs";
import { join } from "node:path";
import { isBuiltinComponentId } from "../components.js";
import type { Lesson } from "../schemas.js";
import {
  assertResolvedPathContained,
  resolveCoursePath,
} from "../course-paths.js";
import type { ValidationIssue } from "../validate.js";

export function validateComponentLesson(
  courseDir: string,
  lesson: Extract<Lesson, { type: "component" }>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (isBuiltinComponentId(lesson.component)) {
    return issues;
  }

  const resolved = resolveCoursePath(
    courseDir,
    join("components", lesson.component),
  );
  if (!resolved.ok) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: resolved.message,
      severity: "error",
    });
    return issues;
  }
  if (!existsSync(resolved.path)) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: `Unknown component "${lesson.component}" and no override at components/${lesson.component}`,
      severity: "error",
    });
    return issues;
  }
  const contained = assertResolvedPathContained(courseDir, resolved.path);
  if (!contained.ok) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: contained.message,
      severity: "error",
    });
    return issues;
  }
  const linkStat = lstatSync(resolved.path);
  if (linkStat.isSymbolicLink()) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: `Symlink not allowed for component override: components/${lesson.component}`,
      severity: "error",
    });
    return issues;
  }
  if (linkStat.isFile() && linkStat.nlink > 1) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: `Hard link not allowed for component override: components/${lesson.component}`,
      severity: "error",
    });
    return issues;
  }
  const componentStat = statSync(resolved.path);
  if (!componentStat.isFile()) {
    issues.push({
      path: `lessons.${lesson.id}.component`,
      message: `Component override path is not a file: components/${lesson.component}`,
      severity: "error",
    });
  }
  return issues;
}
