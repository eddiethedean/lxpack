import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { assertPackagableFile } from "./packagable-path.js";
import {
  assessmentsFromInterchange,
  interchangeToManifest,
  parseLessonkitInterchange,
  collectLessonkitInterchangeWarnings,
  spaLessonRelativePath,
  type LessonkitInterchangeV1,
} from "./lessonkit-interchange.js";
import { resolveRuntimeFromInterchange } from "./theme-presets.js";
import {
  courseManifestSchema,
  type CourseManifest,
} from "./schemas.js";
import {
  formatErrorMessage,
  formatIssuePath,
  loadManifest,
  validateCourse,
  validateCourseManifest,
  type ValidateCourseOptions,
  type ValidationIssue,
  type ValidationResult,
} from "./validate.js";

export type { InterchangeLesson, LessonkitInterchangeV1, LessonKitInterchange } from "./lessonkit-interchange.js";
export {
  assessmentsFromInterchange,
  interchangeToManifest,
  lessonkitInterchangeSchema,
  parseLessonkitInterchange,
  spaLessonRelativePath,
} from "./lessonkit-interchange.js";

export type LoadInterchangeResult =
  | { status: "missing" }
  | { status: "loaded"; fileName: string; data: LessonkitInterchangeV1 }
  | { status: "error"; fileName: string; issues: ValidationIssue[] };

const INTERCHANGE_CANDIDATES = ["lessonkit.json", "lxpack.import.json"] as const;

export interface ValidateCourseWithInterchangeOptions extends ValidateCourseOptions {
  /** In-memory interchange (skips on-disk lessonkit.json for merge). */
  interchange?: LessonkitInterchangeV1;
}

export async function loadLessonKitInterchange(
  courseDir: string,
): Promise<LoadInterchangeResult> {
  for (const fileName of INTERCHANGE_CANDIDATES) {
    const p = join(courseDir, fileName);
    if (!existsSync(p)) continue;

    const resolvedPath = resolve(courseDir, fileName);
    const packCheck = assertPackagableFile(courseDir, resolvedPath, fileName);
    if (!packCheck.ok) {
      return {
        status: "error",
        fileName,
        issues: [
          {
            path: fileName,
            message: packCheck.message,
            severity: "error",
          },
        ],
      };
    }

    let raw: string;
    try {
      raw = await readFile(p, "utf-8");
    } catch (err) {
      return {
        status: "error",
        fileName,
        issues: [
          {
            path: fileName,
            message: `Failed to read interchange file: ${formatErrorMessage(err)}`,
            severity: "error",
          },
        ],
      };
    }

    try {
      const json = JSON.parse(raw) as unknown;
      const parsed = parseLessonkitInterchange(json, fileName);
      if (!parsed.ok) {
        return { status: "error", fileName, issues: parsed.issues };
      }
      return { status: "loaded", fileName, data: parsed.data };
    } catch (err) {
      return {
        status: "error",
        fileName,
        issues: [
          {
            path: fileName,
            message: `Invalid JSON: ${formatErrorMessage(err)}`,
            severity: "error",
          },
        ],
      };
    }
  }
  return { status: "missing" };
}

export function mergeInterchangeIntoManifest(
  base: CourseManifest,
  interchange: LessonkitInterchangeV1,
): CourseManifest {
  const resolvedTitle =
    interchange.course?.title ?? interchange.course?.id;

  const merged: CourseManifest = {
    ...base,
    ...(resolvedTitle ? { title: resolvedTitle } : {}),
    tracking: interchange.tracking
      ? {
          ...(base.tracking ?? {}),
          ...(interchange.tracking.completion?.threshold != null
            ? {
                completion: {
                  threshold: Number(interchange.tracking.completion.threshold),
                },
              }
            : {}),
          ...(interchange.tracking.xapi
            ? { xapi: interchange.tracking.xapi }
            : {}),
        }
      : base.tracking,
    runtime:
      resolveRuntimeFromInterchange(interchange.runtime) ??
      base.runtime ??
      { theme: "modern" },
    lessons: [...base.lessons],
    assessments: [...(base.assessments ?? [])],
  };

  for (const l of interchange.lessons) {
    const path = spaLessonRelativePath(l);
    if (!path) continue;

    const idx = merged.lessons.findIndex((x) => x.id === l.id);
    const lesson = {
      id: l.id,
      type: "spa" as const,
      path,
      ...(l.title ? { title: l.title } : {}),
    };
    if (idx >= 0) {
      merged.lessons[idx] = { ...merged.lessons[idx], ...lesson } as never;
    } else {
      merged.lessons.push(lesson as never);
    }
  }

  const assessmentIds = new Set(merged.assessments?.map((a) => a.id) ?? []);
  for (const a of interchange.assessments ?? []) {
    if (!assessmentIds.has(a.id)) {
      merged.assessments = [
        ...(merged.assessments ?? []),
        { id: a.id, file: `assessments/${a.id}.yaml` },
      ];
      assessmentIds.add(a.id);
    }
  }

  return merged;
}

function manifestParseIssues(
  merged: unknown,
  pathLabel = "course.yaml",
): ValidationIssue[] | null {
  const parsed = courseManifestSchema.safeParse(merged);
  if (parsed.success) return null;
  return parsed.error.issues.map((i) => ({
    path: formatIssuePath(i.path) || pathLabel,
    message: i.message,
    severity: "error" as const,
  }));
}

function resolveInterchangeLoad(
  courseDir: string,
  options?: ValidateCourseWithInterchangeOptions,
): Promise<LoadInterchangeResult> | LoadInterchangeResult {
  if (options?.interchange) {
    return {
      status: "loaded",
      fileName: "lessonkit.json",
      data: options.interchange,
    };
  }
  return loadLessonKitInterchange(courseDir);
}

function withInterchangeWarnings(
  result: ValidationResult,
  interchange: LessonkitInterchangeV1,
  pathLabel: string,
): ValidationResult {
  const warnings = collectLessonkitInterchangeWarnings(interchange, pathLabel);
  if (!warnings.length) return result;
  return { ...result, issues: [...result.issues, ...warnings] };
}

export type ScormSpaLayout = "single-sco-spa" | "multi-sco-spa";

export function inferScormSpaLayout(
  interchange: LessonkitInterchangeV1,
): ScormSpaLayout {
  return interchange.lessons.length <= 1 ? "single-sco-spa" : "multi-sco-spa";
}

function mergeAssessmentData(
  options: ValidateCourseWithInterchangeOptions | undefined,
  interchange: LessonkitInterchangeV1 | undefined,
): unknown[] | undefined {
  if (options?.assessmentData != null) {
    return options.assessmentData;
  }
  if (interchange) {
    return assessmentsFromInterchange(interchange);
  }
  return undefined;
}

/**
 * Validates a course directory, merging optional lessonkit.json / lxpack.import.json
 * into the manifest before validation (same behavior as @lxpack/api and lxpack CLI).
 */
export async function validateCourseWithInterchange(
  courseDir: string,
  options?: ValidateCourseWithInterchangeOptions,
): Promise<ValidationResult> {
  const interchangeLoad = await resolveInterchangeLoad(courseDir, options);
  if (interchangeLoad.status === "error") {
    return { valid: false, issues: interchangeLoad.issues };
  }

  const interchange =
    interchangeLoad.status === "loaded" ? interchangeLoad : null;
  const resolvedDir = resolve(courseDir);
  const hasCourseYaml = existsSync(join(resolvedDir, "course.yaml"));

  if (!hasCourseYaml && interchange) {
    const manifest = interchangeToManifest(interchange.data);
    const parseIssues = manifestParseIssues(
      manifest,
      interchange.fileName,
    );
    if (parseIssues) {
      return { valid: false, issues: parseIssues };
    }

    const assessmentData = mergeAssessmentData(options, interchange.data);
    const validated = await validateCourseManifest(resolvedDir, manifest, {
      ...options,
      assessmentData,
    });
    return withInterchangeWarnings(
      validated,
      interchange.data,
      interchange.fileName,
    );
  }

  if (options?.assessmentData != null) {
    const loaded = await loadManifest(courseDir);
    if (Array.isArray(loaded)) {
      return { valid: false, issues: loaded };
    }

    let manifest = loaded.manifest;
    if (interchange) {
      manifest = mergeInterchangeIntoManifest(manifest, interchange.data);
    }

    const parseIssues = manifestParseIssues(
      manifest,
      interchange?.fileName ?? "course.yaml",
    );
    if (parseIssues) {
      return { valid: false, issues: parseIssues };
    }

    const validated = await validateCourseManifest(courseDir, manifest, options);
    const interchangeData = options?.interchange ?? interchange?.data;
    if (interchangeData) {
      return withInterchangeWarnings(
        validated,
        interchangeData,
        interchange?.fileName ?? "lessonkit.json",
      );
    }
    return validated;
  }

  if (!interchange) {
    return validateCourse(courseDir, options);
  }

  const loaded = await validateCourse(courseDir, options);
  if (!loaded.manifest) {
    return loaded;
  }

  const merged = mergeInterchangeIntoManifest(
    loaded.manifest,
    interchange.data,
  );
  const parseIssues = manifestParseIssues(merged, interchange.fileName);
  if (parseIssues) {
    return { valid: false, issues: [...loaded.issues, ...parseIssues] };
  }

  const assessmentData = mergeAssessmentData(options, interchange.data);
  const revalidated = await validateCourseManifest(courseDir, merged, {
    ...options,
    assessmentData,
  });
  return withInterchangeWarnings(
    revalidated,
    interchange.data,
    interchange.fileName,
  );
}
