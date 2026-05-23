import { existsSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import { readFile } from "node:fs/promises";
import {
  assessmentSchema,
  courseManifestSchema,
  type CourseManifest,
} from "./schemas.js";

export function formatErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function formatIssuePath(path: PropertyKey[]): string {
  const joined = path.map(String).join(".");
  return joined || "course.yaml";
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  manifest?: CourseManifest;
  issues: ValidationIssue[];
}

export function resolveCoursePath(
  courseDir: string,
  relativePath: string,
): { ok: true; path: string } | { ok: false; message: string } {
  if (relativePath.startsWith("/") || /^[a-zA-Z]:\\/.test(relativePath)) {
    return { ok: false, message: "Absolute paths are not allowed" };
  }

  const resolvedDir = resolve(courseDir);
  const resolvedPath = resolve(resolvedDir, relativePath);
  const prefix = `${resolvedDir}${sep}`;

  if (!resolvedPath.startsWith(prefix)) {
    return { ok: false, message: "Path escapes course directory" };
  }

  return { ok: true, path: resolvedPath };
}

export async function loadManifest(
  courseDir: string,
): Promise<{ manifest: CourseManifest; raw: unknown } | ValidationIssue[]> {
  const manifestPath = join(courseDir, "course.yaml");
  if (!existsSync(manifestPath)) {
    return [
      {
        path: "course.yaml",
        message: "Course manifest not found",
        severity: "error",
      },
    ];
  }

  let raw: unknown;
  try {
    const content = await readFile(manifestPath, "utf-8");
    raw = parseYaml(content);
  } catch (err) {
    return [
      {
        path: "course.yaml",
        message: `Failed to parse YAML: ${formatErrorMessage(err)}`,
        severity: "error",
      },
    ];
  }

  const parsed = courseManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      path: formatIssuePath(issue.path),
      message: issue.message,
      severity: "error" as const,
    }));
  }

  return { manifest: parsed.data, raw };
}

export async function validateCourse(
  courseDir: string,
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const resolvedDir = resolve(courseDir);

  const loaded = await loadManifest(resolvedDir);
  if (Array.isArray(loaded)) {
    return { valid: false, issues: loaded };
  }

  const { manifest } = loaded;

  for (const lesson of manifest.lessons) {
    if (lesson.type === "markdown") {
      const resolved = resolveCoursePath(resolvedDir, lesson.file);
      if (!resolved.ok) {
        issues.push({
          path: `lessons.${lesson.id}.file`,
          message: resolved.message,
          severity: "error",
        });
        continue;
      }
      if (!existsSync(resolved.path)) {
        issues.push({
          path: `lessons.${lesson.id}.file`,
          message: `Lesson file not found: ${lesson.file}`,
          severity: "error",
        });
        continue;
      }
      const stat = statSync(resolved.path);
      if (!stat.isFile()) {
        issues.push({
          path: `lessons.${lesson.id}.file`,
          message: `Lesson path is not a file: ${lesson.file}`,
          severity: "error",
        });
      }
    } else if (lesson.type === "html") {
      const resolved = resolveCoursePath(resolvedDir, lesson.path);
      if (!resolved.ok) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: resolved.message,
          severity: "error",
        });
        continue;
      }
      if (!existsSync(resolved.path)) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: `HTML interaction directory not found: ${lesson.path}`,
          severity: "error",
        });
        continue;
      }
      const stat = statSync(resolved.path);
      if (!stat.isDirectory()) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: `HTML interaction path is not a directory: ${lesson.path}`,
          severity: "error",
        });
        continue;
      }
      const indexPath = join(resolved.path, "index.html");
      if (!existsSync(indexPath)) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: `HTML interaction missing index.html: ${lesson.path}`,
          severity: "error",
        });
      } else if (!statSync(indexPath).isFile()) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: `index.html is not a file: ${lesson.path}/index.html`,
          severity: "error",
        });
      }
    }
  }

  if (manifest.assessments) {
    const assessmentIds = new Set<string>();
    for (const ref of manifest.assessments) {
      if (assessmentIds.has(ref.id)) {
        issues.push({
          path: "assessments",
          message: `Duplicate assessment ID: ${ref.id}`,
          severity: "error",
        });
      }
      assessmentIds.add(ref.id);

      const resolved = resolveCoursePath(resolvedDir, ref.file);
      if (!resolved.ok) {
        issues.push({
          path: `assessments.${ref.id}.file`,
          message: resolved.message,
          severity: "error",
        });
        continue;
      }
      if (!existsSync(resolved.path)) {
        issues.push({
          path: `assessments.${ref.id}.file`,
          message: `Assessment file not found: ${ref.file}`,
          severity: "error",
        });
        continue;
      }

      try {
        const content = await readFile(resolved.path, "utf-8");
        const raw = parseYaml(content);
        const parsed = assessmentSchema.safeParse(raw);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            const subPath = issue.path.length
              ? issue.path.join(".")
              : "root";
            issues.push({
              path: `${ref.file}:${subPath}`,
              message: issue.message,
              severity: "error",
            });
          }
          continue;
        }

        if (parsed.data.id !== ref.id) {
          issues.push({
            path: `assessments.${ref.id}`,
            message: `Assessment file id "${parsed.data.id}" does not match manifest ref id "${ref.id}"`,
            severity: "error",
          });
        }
      } catch (err) {
        issues.push({
          path: ref.file,
          message: `Failed to parse assessment: ${formatErrorMessage(err)}`,
          severity: "error",
        });
      }
    }
  }

  const lessonIds = new Set(manifest.lessons.map((l) => l.id));
  if (lessonIds.size !== manifest.lessons.length) {
    issues.push({
      path: "lessons",
      message: "Duplicate lesson IDs detected",
      severity: "error",
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    manifest,
    issues,
  };
}
