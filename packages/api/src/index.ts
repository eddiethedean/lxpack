import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  validateCourse as validateCourseInternal,
  validateCourseManifest,
  loadManifest,
  buildRuntimeAssessmentBundleFromParsed,
  buildRuntimeAssessmentBundleFromData,
  courseManifestSchema,
  type CourseManifest,
  type ValidationIssue,
} from "@lxpack/validators";
import {
  courseSlug,
  packageCourse,
  packageScorm2004Dir,
  packageStandaloneDir,
  type ExportTarget,
} from "@lxpack/scorm";
import { readComponentsBundle, readRuntimeBundle } from "./bundle-io.js";
import { resolveBuildOutputPath } from "./output-paths.js";
import { loadLessonKitInterchange } from "./interchange.js";

export type { ExportTarget } from "@lxpack/scorm";
export type { CourseManifest, ValidationIssue } from "@lxpack/validators";

export interface ValidateCourseOptions {
  courseDir: string;
  target?: ExportTarget;
}

export type ValidateCourseResult =
  | {
      ok: true;
      manifest: CourseManifest;
      issues: ValidationIssue[];
    }
  | {
      ok: false;
      manifest?: CourseManifest;
      issues: ValidationIssue[];
    };

export async function validateCourse(
  options: ValidateCourseOptions,
): Promise<ValidateCourseResult> {
  const interchange = await loadLessonKitInterchange(options.courseDir);
  const validation = await (async () => {
    if (!interchange) {
      return validateCourseInternal(options.courseDir, {
        exportTarget: options.target,
      });
    }

    const loaded = await validateCourseInternal(options.courseDir, {
      exportTarget: options.target,
    });
    if (!loaded.manifest) return loaded;

    const merged = mergeInterchangeIntoManifest(loaded.manifest, interchange.data);
    const parsed = courseManifestSchema.safeParse(merged);
    if (!parsed.success) {
      return {
        valid: false,
        issues: parsed.error.issues.map((i) => ({
          path: i.path.map(String).join(".") || "course.yaml",
          message: i.message,
          severity: "error" as const,
        })),
      };
    }

    return validateCourseManifest(options.courseDir, parsed.data, {
      exportTarget: options.target,
    });
  })();

  const ok = validation.valid && Boolean(validation.manifest);
  if (!validation.manifest) {
    return { ok: false, issues: validation.issues };
  }

  return {
    ok,
    manifest: validation.manifest,
    issues: validation.issues,
  };
}

export interface BuildCourseOptions {
  courseDir: string;
  target: ExportTarget;
  /** Output zip file path (zip builds) or output directory (dir builds). */
  output?: string;
  /** If true, writes a directory instead of a zip. */
  dir?: boolean;
  /** Base output folder under courseDir when output is omitted. */
  outputBaseDir?: string;
  /** Optional injected assessments (adapter-driven; no on-disk YAML required). */
  assessments?: unknown[];
}

export type BuildCourseResult =
  | {
      ok: true;
      target: ExportTarget;
      outputPath?: string;
      outputDir?: string;
      fileCount: number;
      manifest: CourseManifest;
      issues: ValidationIssue[];
    }
  | {
      ok: false;
      target: ExportTarget;
      manifest?: CourseManifest;
      issues: ValidationIssue[];
    };

export async function buildCourse(
  options: BuildCourseOptions,
): Promise<BuildCourseResult> {
  const interchange = await loadLessonKitInterchange(options.courseDir);
  const validation = await (async () => {
    // If injected assessment data is provided, avoid validating/reading assessment YAML from disk.
    if (options.assessments != null) {
      const loaded = await loadManifest(options.courseDir);
      if (Array.isArray(loaded)) {
        return { valid: false, issues: loaded };
      }
      const base = loaded.manifest;
      const merged = interchange
        ? mergeInterchangeIntoManifest(base, interchange.data)
        : base;
      const parsed = courseManifestSchema.safeParse(merged);
      if (!parsed.success) {
        return {
          valid: false,
          issues: parsed.error.issues.map((i) => ({
            path: i.path.map(String).join(".") || "course.yaml",
            message: i.message,
            severity: "error" as const,
          })),
        };
      }
      return validateCourseManifest(options.courseDir, parsed.data, {
        exportTarget: options.target,
        assessmentData: options.assessments,
      });
    }

    if (!interchange) {
      return validateCourseInternal(options.courseDir, {
        exportTarget: options.target,
      });
    }

    const loaded = await validateCourseInternal(options.courseDir, {
      exportTarget: options.target,
    });
    if (!loaded.manifest) return loaded;

    const merged = mergeInterchangeIntoManifest(loaded.manifest, interchange.data);
    const parsed = courseManifestSchema.safeParse(merged);
    if (!parsed.success) {
      return {
        valid: false,
        issues: parsed.error.issues.map((i) => ({
          path: i.path.map(String).join(".") || "course.yaml",
          message: i.message,
          severity: "error" as const,
        })),
      };
    }

    return validateCourseManifest(options.courseDir, parsed.data, {
      exportTarget: options.target,
    });
  })();

  if (!validation.valid || !validation.manifest) {
    return {
      ok: false,
      target: options.target,
      manifest: validation.manifest,
      issues: validation.issues,
    };
  }

  const assessmentInjection =
    options.assessments != null
      ? buildRuntimeAssessmentBundleFromData(
          validation.manifest,
          options.assessments,
        )
      : null;

  if (assessmentInjection?.issues?.some((i) => i.severity === "error")) {
    return {
      ok: false,
      target: options.target,
      manifest: validation.manifest,
      issues: [...validation.issues, ...assessmentInjection.issues],
    };
  }

  const assessmentBundle =
    assessmentInjection?.bundle ??
    buildRuntimeAssessmentBundleFromParsed(validation.parsedAssessments ?? new Map());

  const [{ clientJs, css }, componentsBundleJs] = await Promise.all([
    readRuntimeBundle(),
    readComponentsBundle(),
  ]);

  const manifest = validation.manifest;
  const slug = courseSlug(manifest);
  const outputBase = options.outputBaseDir ?? ".lxpack";
  const outputRoot = resolveBuildOutputPath(options.courseDir, outputBase);
  await mkdir(outputRoot, { recursive: true });

  const packageOptions = {
    courseDir: options.courseDir,
    manifest,
    target: options.target,
    runtimeClientJs: clientJs,
    runtimeCss: css,
    componentsBundleJs,
    assessmentBundle,
  };

  if (options.dir) {
    const outputDir = options.output
      ? resolveBuildOutputPath(options.courseDir, options.output)
      : join(outputRoot, options.target);
    const result =
      options.target === "scorm2004"
        ? await packageScorm2004Dir({ ...packageOptions, outputDir })
        : await packageStandaloneDir({ ...packageOptions, outputDir });
    return {
      ok: true,
      target: options.target,
      outputDir: result.outputDir,
      fileCount: result.fileCount,
      manifest,
      issues: validation.issues,
    };
  }

  const defaultName =
    options.target === "standalone"
      ? `${slug}-standalone.zip`
      : options.target === "scorm2004"
        ? `${slug}-scorm2004.zip`
        : options.target === "xapi"
          ? `${slug}-xapi.zip`
          : options.target === "cmi5"
            ? `${slug}-cmi5.zip`
            : `${slug}-scorm12.zip`;
  const outputPath = options.output
    ? resolveBuildOutputPath(options.courseDir, options.output)
    : join(outputRoot, defaultName);

  const result = await packageCourse({ ...packageOptions, outputPath });
  return {
    ok: true,
    target: options.target,
    outputPath: result.outputPath,
    fileCount: result.fileCount,
    manifest,
    issues: validation.issues,
  };
}

function mergeInterchangeIntoManifest(
  base: CourseManifest,
  interchange: unknown,
): CourseManifest {
  const ix = interchange as {
    lessons?: Array<{
      id?: string;
      title?: string;
      type?: string;
      path?: string;
      build?: { outputDir?: string };
    }>;
    tracking?: { completion?: { threshold?: number } };
  };

  const merged: CourseManifest = {
    ...base,
    tracking: ix?.tracking?.completion?.threshold != null
      ? {
          ...(base.tracking ?? {}),
          completion: {
            threshold: Number(ix.tracking.completion.threshold),
          },
        }
      : base.tracking,
    lessons: [...base.lessons],
  };

  for (const l of ix.lessons ?? []) {
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

