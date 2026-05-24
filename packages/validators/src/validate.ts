import { existsSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
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

export function isPathContained(rootDir: string, candidatePath: string): boolean {
  const root = resolve(rootDir);
  const candidate = resolve(candidatePath);
  const rel = relative(root, candidate);
  if (rel === "") return true;
  return !rel.startsWith("..") && !isAbsolute(rel);
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

  if (!isPathContained(resolvedDir, resolvedPath)) {
    return { ok: false, message: "Path escapes course directory" };
  }

  return { ok: true, path: resolvedPath };
}

export function assertResolvedPathContained(
  courseDir: string,
  resolvedPath: string,
): { ok: true } | { ok: false; message: string } {
  try {
    const root = realpathSync(resolve(courseDir));
    const target = realpathSync(resolvedPath);
    if (!isPathContained(root, target)) {
      return { ok: false, message: "Path escapes course directory" };
    }
    return { ok: true };
  /* v8 ignore start -- broken symlinks or missing realpath targets */
  } catch {
    return { ok: false, message: "Path could not be resolved" };
  }
  /* v8 ignore end */
}

export async function loadManifest(
  courseDir: string,
): Promise<{ manifest: CourseManifest; raw: unknown } | ValidationIssue[]> {
  const resolvedDir = resolve(courseDir);
  const manifestPath = join(resolvedDir, "course.yaml");
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
      const contained = assertResolvedPathContained(resolvedDir, resolved.path);
      if (!contained.ok) {
        issues.push({
          path: `lessons.${lesson.id}.file`,
          message: contained.message,
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
      const contained = assertResolvedPathContained(resolvedDir, resolved.path);
      if (!contained.ok) {
        issues.push({
          path: `lessons.${lesson.id}.path`,
          message: contained.message,
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
      } else {
        const indexContained = assertResolvedPathContained(
          resolvedDir,
          indexPath,
        );
        if (!indexContained.ok) {
          issues.push({
            path: `lessons.${lesson.id}.path`,
            message: indexContained.message,
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
      const contained = assertResolvedPathContained(resolvedDir, resolved.path);
      if (!contained.ok) {
        issues.push({
          path: `assessments.${ref.id}.file`,
          message: contained.message,
          severity: "error",
        });
        continue;
      }

      const assessmentStat = statSync(resolved.path);
      if (!assessmentStat.isFile()) {
        issues.push({
          path: `assessments.${ref.id}.file`,
          message: `Assessment path is not a file: ${ref.file}`,
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
      /* v8 ignore start -- read errors are rare once existence checks pass */
      } catch (err) {
        issues.push({
          path: ref.file,
          message: `Failed to parse assessment: ${formatErrorMessage(err)}`,
          severity: "error",
        });
      }
      /* v8 ignore end */
    }
  }

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

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    manifest,
    issues,
  };
}
