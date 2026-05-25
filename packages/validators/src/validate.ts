import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { detectFlowCycles, validateFlow } from "./flow-validate.js";
import { loadParsedAssessments } from "./course-assessments.js";
import {
  courseManifestSchema,
  type Assessment,
  type CourseManifest,
} from "./schemas.js";
import { lessonValidators } from "./validate/registry.js";
import { validateActivityIds } from "./validate/ids.js";

export {
  isPathContained,
  resolveCoursePath,
  assertResolvedPathContained,
} from "./course-paths.js";

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
  /** Populated when assessment files parse successfully. */
  parsedAssessments?: Map<string, Assessment>;
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
    issues.push(...lessonValidators[lesson.type](resolvedDir, lesson));
  }

  const assessmentLoad = await loadParsedAssessments(resolvedDir, manifest);
  issues.push(...assessmentLoad.issues);

  issues.push(...validateActivityIds(manifest));
  issues.push(...validateFlow(manifest));

  if (manifest.flow?.length) {
    for (const message of detectFlowCycles(manifest)) {
      issues.push({
        path: "flow",
        message,
        severity: "error",
      });
    }
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    manifest,
    issues,
    parsedAssessments: assessmentLoad.parsed,
  };
}
