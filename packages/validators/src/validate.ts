import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
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
      if (!lesson.file) {
        issues.push({
          path: `lessons.${lesson.id}`,
          message: "Markdown lessons require a file property",
          severity: "error",
        });
        continue;
      }
      const filePath = join(resolvedDir, lesson.file);
      if (!existsSync(filePath)) {
        issues.push({
          path: lesson.file,
          message: `Lesson file not found: ${lesson.file}`,
          severity: "error",
        });
      }
    } else if (lesson.type === "html") {
      if (!lesson.path) {
        issues.push({
          path: `lessons.${lesson.id}`,
          message: "HTML lessons require a path property",
          severity: "error",
        });
        continue;
      }
      const interactionDir = join(resolvedDir, lesson.path);
      const indexPath = join(interactionDir, "index.html");
      if (!existsSync(indexPath)) {
        issues.push({
          path: lesson.path,
          message: `HTML interaction missing index.html: ${lesson.path}`,
          severity: "error",
        });
      }
    }
  }

  if (manifest.assessments) {
    for (const ref of manifest.assessments) {
      const assessmentPath = join(resolvedDir, ref.file);
      if (!existsSync(assessmentPath)) {
        issues.push({
          path: ref.file,
          message: `Assessment file not found: ${ref.file}`,
          severity: "error",
        });
        continue;
      }

      try {
        const content = await readFile(assessmentPath, "utf-8");
        const raw = parseYaml(content);
        const parsed = assessmentSchema.safeParse(raw);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            issues.push({
              path: `${ref.file}:${issue.path.join(".")}`,
              message: issue.message,
              severity: "error",
            });
          }
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
