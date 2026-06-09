import { z } from "zod";
import { conditionSchema, flowRuleSchema } from "./conditions.js";

/** Safe for SCORM paths and manifest identifiers. */
export const activityIdSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    "ID must start with a letter and contain only letters, numbers, underscores, and hyphens",
  );

const choiceSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    correct: z.boolean().optional(),
  })
  .strict();

export const selectionModeSchema = z.enum(["single", "multiple"]);

export const assessmentQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    choices: z.array(choiceSchema).min(1),
    explanation: z.string().optional(),
    selectionMode: selectionModeSchema.optional(),
  })
  .strict()
  .superRefine((question, ctx) => {
    const correctChoices = question.choices.filter((c) => c.correct === true);
    const correctCount = correctChoices.length;
    if (correctCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each question must have at least one correct choice",
        path: ["choices"],
      });
      return;
    }
    const inferredMode =
      question.selectionMode ??
      (correctCount > 1 ? ("multiple" as const) : ("single" as const));
    if (inferredMode === "single" && correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single-select questions must have exactly one correct choice",
        path: ["choices"],
      });
    }
    if (inferredMode === "multiple" && correctCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Multi-select questions must have at least two correct choices",
        path: ["choices"],
      });
    }
    const choiceIds = new Set<string>();
    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i]!;
      if (choiceIds.has(choice.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate choice id: ${choice.id}`,
          path: ["choices", i, "id"],
        });
      }
      choiceIds.add(choice.id);
    }
  });

export const markdownLessonSchema = z
  .object({
    id: activityIdSchema,
    type: z.literal("markdown"),
    file: z.string().min(1),
    title: z.string().optional(),
  })
  .strict();

export const htmlLessonSchema = z
  .object({
    id: activityIdSchema,
    type: z.literal("html"),
    path: z.string().min(1),
    title: z.string().optional(),
  })
  .strict();

export const spaLessonSchema = z
  .object({
    id: activityIdSchema,
    type: z.literal("spa"),
    path: z.string().min(1),
    title: z.string().optional(),
    runtime: z
      .object({
        mount: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const componentLessonSchema = z
  .object({
    id: activityIdSchema,
    type: z.literal("component"),
    component: activityIdSchema,
    props: z.record(z.unknown()).optional(),
    title: z.string().optional(),
  })
  .strict();

export const lessonSchema = z.discriminatedUnion("type", [
  markdownLessonSchema,
  htmlLessonSchema,
  spaLessonSchema,
  componentLessonSchema,
]);

export const showFeedbackSchema = z.enum(["immediate", "end", "never"]).default("never");

export const assessmentSchema = z
  .object({
    id: activityIdSchema,
    title: z.string().optional(),
    passingScore: z.number().min(0).max(1).default(0.7),
    maxAttempts: z.number().int().min(1).optional(),
    shuffleChoices: z.boolean().optional(),
    showFeedback: showFeedbackSchema.optional(),
    questions: z.array(assessmentQuestionSchema).min(1),
  })
  .strict()
  .superRefine((assessment, ctx) => {
    const questionIds = new Set<string>();
    for (let i = 0; i < assessment.questions.length; i++) {
      const q = assessment.questions[i]!;
      if (questionIds.has(q.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate question id: ${q.id}`,
          path: ["questions", i, "id"],
        });
      }
      questionIds.add(q.id);
    }
  });

export const assessmentRefSchema = z
  .object({
    id: activityIdSchema,
    file: z.string().min(1),
  })
  .strict();

export const variableDefSchema = z
  .object({
    default: z.union([z.string(), z.number(), z.boolean()]),
    type: z.enum(["string", "number", "boolean"]).optional(),
  })
  .strict()
  .superRefine((def, ctx) => {
    const t = def.type;
    if (t === "string" && typeof def.default !== "string") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Default must be a string when type is string",
        path: ["default"],
      });
    }
    if (t === "number" && typeof def.default !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Default must be a number when type is number",
        path: ["default"],
      });
    }
    if (t === "boolean" && typeof def.default !== "boolean") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Default must be a boolean when type is boolean",
        path: ["default"],
      });
    }
  });

export const xapiTrackingSchema = z
  .object({
    activityIri: z
      .string()
      .url()
      .refine((u) => u.startsWith("https://"), {
        message: "activityIri must be an https URL",
      }),
    displayName: z.string().min(1).optional(),
  })
  .strict();

export const trackingSchema = z
  .object({
    completion: z
      .object({
        threshold: z.number().min(0).max(1).default(0.9),
      })
      .strict()
      .optional(),
    xapi: xapiTrackingSchema.optional(),
  })
  .strict()
  .optional();

export type XapiTrackingConfig = z.infer<typeof xapiTrackingSchema>;

export const runtimeConfigSchema = z
  .object({
    theme: z.string().default("modern"),
    cssVariables: z.record(z.string()).optional(),
  })
  .strict()
  .optional();

export { conditionSchema, flowRuleSchema };

export const courseManifestSchema = z
  .object({
    title: z.string().min(1),
    version: z.string().min(1),
    description: z.string().optional(),
    runtime: runtimeConfigSchema,
    tracking: trackingSchema,
    variables: z.record(variableDefSchema).optional(),
    flow: z.array(flowRuleSchema).optional(),
    lessons: z.array(lessonSchema).min(1),
    assessments: z.array(assessmentRefSchema).optional(),
  })
  .strict();

export type CourseManifest = z.infer<typeof courseManifestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentRef = z.infer<typeof assessmentRefSchema>;
export type VariableDef = z.infer<typeof variableDefSchema>;
export type ComponentLesson = z.infer<typeof componentLessonSchema>;
export type ShowFeedback = z.infer<typeof showFeedbackSchema>;
