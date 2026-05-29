import { z } from "zod";
import {
  activityIdSchema,
  assessmentSchema,
  courseManifestSchema,
  xapiTrackingSchema,
  type CourseManifest,
} from "./schemas.js";
import { formatIssuePath, type ValidationIssue } from "./validate.js";
import {
  resolveRuntimeFromInterchange,
  warnThemePresetCssOverlap,
} from "./theme-presets.js";

const interchangeSpaLessonSchema = z
  .object({
    id: activityIdSchema,
    title: z.string().min(1).optional(),
    type: z.literal("spa"),
    path: z.string().min(1).optional(),
    build: z
      .object({
        outputDir: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((lesson, ctx) => {
    const path = lesson.path ?? lesson.build?.outputDir;
    if (!path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SPA lesson requires path or build.outputDir",
        path: ["path"],
      });
    }
  });

/** Inline assessments in interchange (optional; may also be injected at build time). */
const interchangeAssessmentSchema = assessmentSchema;

export const lessonkitInterchangeSchema = z
  .object({
    format: z.literal("lessonkit"),
    version: z.literal("1"),
    course: z
      .object({
        id: activityIdSchema.optional(),
        title: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    lessons: z.array(interchangeSpaLessonSchema).min(1),
    assessments: z.array(interchangeAssessmentSchema).optional(),
    tracking: z
      .object({
        completion: z
          .object({
            threshold: z.number().min(0).max(1),
          })
          .strict()
          .optional(),
        xapi: xapiTrackingSchema.optional(),
      })
      .strict()
      .optional(),
    runtime: z
      .object({
        theme: z.string().min(1).optional(),
        cssVariables: z.record(z.string()).optional(),
        themePreset: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type LessonkitInterchangeV1 = z.infer<typeof lessonkitInterchangeSchema>;

/** @deprecated Use LessonkitInterchangeV1 */
export type LessonKitInterchange = LessonkitInterchangeV1;

export type InterchangeLesson = LessonkitInterchangeV1["lessons"][number];

export type ParseLessonkitInterchangeResult =
  | { ok: true; data: LessonkitInterchangeV1 }
  | { ok: false; issues: ValidationIssue[] };

export function parseLessonkitInterchange(
  raw: unknown,
  pathLabel = "lessonkit.json",
): ParseLessonkitInterchangeResult {
  const parsed = lessonkitInterchangeSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => ({
      path: pathLabel + (issue.path.length ? `.${formatIssuePath(issue.path)}` : ""),
      message: issue.message,
      severity: "error" as const,
    })),
  };
}

export function spaLessonRelativePath(
  lesson: InterchangeLesson,
): string | undefined {
  return lesson.path ?? lesson.build?.outputDir;
}

export function interchangeToManifest(
  interchange: LessonkitInterchangeV1,
): CourseManifest {
  const title =
    interchange.course?.title ??
    interchange.course?.id ??
    "Untitled Course";

  const lessons = interchange.lessons.map((l) => {
    const path = spaLessonRelativePath(l)!;
    return {
      id: l.id,
      type: "spa" as const,
      path,
      ...(l.title ? { title: l.title } : {}),
    };
  });

  const assessments = interchange.assessments?.map((a) => ({
    id: a.id,
    file: `assessments/${a.id}.yaml`,
  }));

  const manifest: CourseManifest = {
    title,
    version: "1.0.0",
    lessons,
    ...(assessments?.length ? { assessments } : {}),
    ...(interchange.tracking
      ? {
          tracking: {
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
          },
        }
      : {}),
    ...(resolveRuntimeFromInterchange(interchange.runtime)
      ? { runtime: resolveRuntimeFromInterchange(interchange.runtime) }
      : {}),
  };

  const parsed = courseManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    throw new Error(
      `interchangeToManifest produced invalid manifest: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export function collectLessonkitInterchangeWarnings(
  interchange: LessonkitInterchangeV1,
  pathLabel = "lessonkit.json",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const themeWarn = warnThemePresetCssOverlap(interchange.runtime);
  if (themeWarn) {
    issues.push({
      path: pathLabel,
      message: themeWarn,
      severity: "warning",
    });
  }
  if (interchange.lessons.length > 1) {
    const paths = interchange.lessons.map((l) => spaLessonRelativePath(l));
    const unique = new Set(paths);
    if (unique.size < paths.length) {
      issues.push({
        path: pathLabel,
        message:
          "Multiple SPA lessons share the same path; use distinct dist folders for multi-SCO SCORM 2004 (see scorm-spa-recipes guide)",
        severity: "warning",
      });
    }
  }
  return issues;
}

/** Assessment payloads embedded in interchange (for injection without on-disk YAML). */
export function assessmentsFromInterchange(
  interchange: LessonkitInterchangeV1,
): unknown[] | undefined {
  if (!interchange.assessments?.length) {
    return undefined;
  }
  return interchange.assessments;
}
