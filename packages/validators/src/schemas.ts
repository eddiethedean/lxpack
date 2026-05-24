import { z } from "zod";

const choiceSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    correct: z.boolean().optional(),
  })
  .strict();

export const assessmentQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    choices: z.array(choiceSchema).min(1),
    explanation: z.string().optional(),
  })
  .strict()
  .superRefine((question, ctx) => {
    const correctCount = question.choices.filter((c) => c.correct === true).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each question must have exactly one correct choice",
        path: ["choices"],
      });
    }
  });

export const markdownLessonSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("markdown"),
    file: z.string().min(1),
    title: z.string().optional(),
  })
  .strict();

export const htmlLessonSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("html"),
    path: z.string().min(1),
    title: z.string().optional(),
  })
  .strict();

export const lessonSchema = z.discriminatedUnion("type", [
  markdownLessonSchema,
  htmlLessonSchema,
]);

export const assessmentSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    passingScore: z.number().min(0).max(1).default(0.7),
    questions: z.array(assessmentQuestionSchema).min(1),
  })
  .strict();

export const assessmentRefSchema = z
  .object({
    id: z.string().min(1),
    file: z.string().min(1),
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
  })
  .strict()
  .optional();

export const runtimeConfigSchema = z
  .object({
    theme: z.string().default("modern"),
  })
  .strict()
  .optional();

export const courseManifestSchema = z
  .object({
    title: z.string().min(1),
    version: z.string().min(1),
    description: z.string().optional(),
    runtime: runtimeConfigSchema,
    tracking: trackingSchema,
    lessons: z.array(lessonSchema).min(1),
    assessments: z.array(assessmentRefSchema).optional(),
  })
  .strict();

export type CourseManifest = z.infer<typeof courseManifestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentRef = z.infer<typeof assessmentRefSchema>;
