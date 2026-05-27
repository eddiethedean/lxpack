import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

export type InterchangeLesson = {
  id: string;
  title?: string;
  type: "spa";
  path?: string;
  build?: { outputDir?: string };
};

export type LessonKitInterchange = {
  format?: string;
  version?: string;
  course?: { id?: string; title?: string };
  lessons?: InterchangeLesson[];
  tracking?: { completion?: { threshold?: number } };
};

export type LoadInterchangeResult =
  | { status: "missing" }
  | { status: "loaded"; fileName: string; data: LessonKitInterchange }
  | { status: "error"; fileName: string; issues: ValidationIssue[] };

const INTERCHANGE_CANDIDATES = ["lessonkit.json", "lxpack.import.json"] as const;

export async function loadLessonKitInterchange(
  courseDir: string,
): Promise<LoadInterchangeResult> {
  for (const fileName of INTERCHANGE_CANDIDATES) {
    const p = join(courseDir, fileName);
    if (!existsSync(p)) continue;

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
      const data = JSON.parse(raw) as LessonKitInterchange;
      return { status: "loaded", fileName, data };
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
  interchange: LessonKitInterchange,
): CourseManifest {
  const merged: CourseManifest = {
    ...base,
    tracking:
      interchange.tracking?.completion?.threshold != null
        ? {
            ...(base.tracking ?? {}),
            completion: {
              threshold: Number(interchange.tracking.completion.threshold),
            },
          }
        : base.tracking,
    lessons: [...base.lessons],
  };

  for (const l of interchange.lessons ?? []) {
    if (!l?.id || l.type !== "spa") continue;
    const path = l.path ?? l.build?.outputDir;
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

/**
 * Validates a course directory, merging optional lessonkit.json / lxpack.import.json
 * into the manifest before validation (same behavior as @lxpack/api and lxpack CLI).
 */
export async function validateCourseWithInterchange(
  courseDir: string,
  options?: ValidateCourseOptions,
): Promise<ValidationResult> {
  const interchangeLoad = await loadLessonKitInterchange(courseDir);
  if (interchangeLoad.status === "error") {
    return { valid: false, issues: interchangeLoad.issues };
  }

  const interchange =
    interchangeLoad.status === "loaded" ? interchangeLoad : null;

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

    return validateCourseManifest(courseDir, manifest, options);
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

  const revalidated = await validateCourseManifest(courseDir, merged, options);
  return {
    ...revalidated,
    issues: [...loaded.issues, ...revalidated.issues],
  };
}
