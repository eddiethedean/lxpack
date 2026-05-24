import type { CourseManifest } from "../schemas.js";
import type { ValidationIssue } from "../validate.js";

export function validateActivityIds(manifest: CourseManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const lessonIdCounts = new Map<string, number>();
  for (const lesson of manifest.lessons) {
    lessonIdCounts.set(lesson.id, (lessonIdCounts.get(lesson.id) ?? 0) + 1);
  }
  for (const [id, count] of lessonIdCounts) {
    if (count > 1) {
      issues.push({
        path: "lessons",
        message: `Duplicate lesson ID: ${id}`,
        severity: "error",
      });
    }
  }

  const assessmentIdSet = new Set<string>();
  for (const ref of manifest.assessments ?? []) {
    assessmentIdSet.add(ref.id);
  }
  for (const lesson of manifest.lessons) {
    if (assessmentIdSet.has(lesson.id)) {
      issues.push({
        path: "lessons",
        message: `Lesson ID "${lesson.id}" conflicts with an assessment ID`,
        severity: "error",
      });
    }
  }

  return issues;
}
