import { readdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import type { CourseManifest } from "../schemas.js";
import { assertResolvedPathContained } from "../course-paths.js";
import type { ValidationIssue } from "../validate.js";

const KNOWN_TOP_LEVEL = new Set([
  "course.yaml",
  "lxpack.config.json",
  "lxpack.config.ts",
  "lessons",
  "interactions",
  "assessments",
  "components",
  "assets",
  "theme",
  ".lxpack",
  "node_modules",
  "package.json",
  "README.md",
  "lessonkit.json",
  "lxpack.import.json",
]);

const SENSITIVE_TOP_LEVEL = new Set([".env", ".git"]);

export async function validateUnexpectedCourseFiles(
  courseDir: string,
  _manifest: CourseManifest,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const entries = await readdir(courseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (KNOWN_TOP_LEVEL.has(entry.name)) {
      continue;
    }
    if (SENSITIVE_TOP_LEVEL.has(entry.name) || entry.name.startsWith(".")) {
      issues.push({
        path: entry.name,
        message:
          "Unexpected file or folder in course root (may be packaged into exports)",
        severity: "warning",
      });
      continue;
    }
    if (entry.isFile()) {
      issues.push({
        path: entry.name,
        message:
          "Unexpected file in course root (will be included in export packages)",
        severity: "warning",
      });
    }
  }

  return issues;
}

export async function validateInteractionTree(
  courseDir: string,
  interactionDir: string,
  issuePath: string,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) {
        issues.push({
          path: issuePath,
          message: `Symlink not allowed under interaction directory: ${entry.name}`,
          severity: "error",
        });
        continue;
      }
      if (stat.isFile() && stat.nlink > 1) {
        issues.push({
          path: issuePath,
          message: `Hard link not allowed under interaction directory: ${entry.name}`,
          severity: "error",
        });
        continue;
      }
      const contained = assertResolvedPathContained(courseDir, fullPath);
      if (!contained.ok) {
        issues.push({
          path: issuePath,
          message: contained.message,
          severity: "error",
        });
        continue;
      }
      if (stat.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(interactionDir);
  return issues;
}
