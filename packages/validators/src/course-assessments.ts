import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { resolveCoursePath } from "./course-paths.js";
import {
  assessmentSchema,
  type Assessment,
  type CourseManifest,
} from "./schemas.js";
import type { ValidationIssue } from "./validate.js";
import { assertPackagableFile } from "./packagable-path.js";
import { validateAssessmentFilePath } from "./safe-relative-path.js";
import { formatErrorMessage } from "./validate.js";
import {
  toLearnerAssessment,
  type RuntimeAssessmentBundle,
} from "./assessments.js";

export interface ParsedAssessmentsResult {
  parsed: Map<string, Assessment>;
  issues: ValidationIssue[];
}

export async function loadParsedAssessments(
  courseDir: string,
  manifest: CourseManifest,
): Promise<ParsedAssessmentsResult> {
  const resolvedDir = courseDir;
  const issues: ValidationIssue[] = [];
  const parsed = new Map<string, Assessment>();
  const assessmentIds = new Set<string>();

  for (const ref of manifest.assessments ?? []) {
    if (assessmentIds.has(ref.id)) {
      issues.push({
        path: "assessments",
        message: `Duplicate assessment ID: ${ref.id}`,
        severity: "error",
      });
      continue;
    }
    assessmentIds.add(ref.id);

    const assessmentPathError = validateAssessmentFilePath(ref.file);
    if (assessmentPathError) {
      issues.push({
        path: `assessments.${ref.id}.file`,
        message: assessmentPathError,
        severity: "error",
      });
      continue;
    }

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
    const packagable = assertPackagableFile(
      resolvedDir,
      resolved.path,
      ref.file,
    );
    if (!packagable.ok) {
      issues.push({
        path: `assessments.${ref.id}.file`,
        message: packagable.message,
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
      const result = assessmentSchema.safeParse(raw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const subPath = issue.path.length ? issue.path.join(".") : "root";
          issues.push({
            path: `${ref.file}:${subPath}`,
            message: issue.message,
            severity: "error",
          });
        }
        continue;
      }

      if (result.data.id !== ref.id) {
        issues.push({
          path: `assessments.${ref.id}`,
          message: `Assessment file id "${result.data.id}" does not match manifest ref id "${ref.id}"`,
          severity: "error",
        });
        continue;
      }

      parsed.set(ref.id, result.data);
    } catch (err) {
      issues.push({
        path: ref.file,
        message: `Failed to parse assessment: ${formatErrorMessage(err)}`,
        severity: "error",
      });
    }
  }

  return { parsed, issues };
}

export function buildRuntimeAssessmentBundleFromParsed(
  parsed: Map<string, Assessment>,
): RuntimeAssessmentBundle {
  const assessments: RuntimeAssessmentBundle["assessments"] = {};
  const answerKeys: RuntimeAssessmentBundle["answerKeys"] = {};
  const configs: RuntimeAssessmentBundle["configs"] = {};
  const feedback: RuntimeAssessmentBundle["feedback"] = {};

  for (const [id, assessment] of parsed) {
    const built = toLearnerAssessment(assessment);
    assessments[id] = built.learner;
    answerKeys[id] = built.answerKey;
    configs[id] = built.config;
    feedback[id] = built.feedback;
  }

  return { assessments, answerKeys, configs, feedback };
}

export function loadParsedAssessmentsFromData(
  manifest: CourseManifest,
  data: unknown[],
): ParsedAssessmentsResult {
  const issues: ValidationIssue[] = [];
  const parsed = new Map<string, Assessment>();

  const assessmentIds = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const raw = data[i];
    const result = assessmentSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const subPath = issue.path.length ? issue.path.join(".") : "root";
        issues.push({
          path: `assessments[${i}].${subPath}`,
          message: issue.message,
          severity: "error",
        });
      }
      continue;
    }

    const id = result.data.id;
    if (assessmentIds.has(id)) {
      issues.push({
        path: `assessments[${i}].id`,
        message: `Duplicate assessment id: ${id}`,
        severity: "error",
      });
      continue;
    }
    assessmentIds.add(id);
    parsed.set(id, result.data);
  }

  const declared = manifest.assessments ?? [];
  if (declared.length) {
    for (const ref of declared) {
      if (!parsed.has(ref.id)) {
        issues.push({
          path: `assessments.${ref.id}`,
          message:
            "Assessment is declared in course.yaml but was not provided in injected assessment data",
          severity: "error",
        });
      }
    }
  }

  return { parsed, issues };
}

export function buildRuntimeAssessmentBundleFromData(
  manifest: CourseManifest,
  data: unknown[],
): { bundle: RuntimeAssessmentBundle; issues: ValidationIssue[] } {
  const loaded = loadParsedAssessmentsFromData(manifest, data);
  const errors = loaded.issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return { bundle: buildRuntimeAssessmentBundleFromParsed(new Map()), issues: loaded.issues };
  }
  return { bundle: buildRuntimeAssessmentBundleFromParsed(loaded.parsed), issues: loaded.issues };
}

export async function buildRuntimeAssessmentBundle(
  courseDir: string,
  manifest: CourseManifest,
): Promise<RuntimeAssessmentBundle> {
  const { parsed, issues } = await loadParsedAssessments(courseDir, manifest);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      errors.map((i) => `${i.path}: ${i.message}`).join("; "),
    );
  }
  return buildRuntimeAssessmentBundleFromParsed(parsed);
}
