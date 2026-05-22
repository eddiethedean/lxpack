import { z } from "zod";

export const lessonSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["markdown", "html"]),
  file: z.string().optional(),
  path: z.string().optional(),
  title: z.string().optional(),
});

export const assessmentQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  choices: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      correct: z.boolean().optional(),
    }),
  ),
  explanation: z.string().optional(),
});

export const assessmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  passingScore: z.number().min(0).max(1).default(0.7),
  questions: z.array(assessmentQuestionSchema).min(1),
});

export const assessmentRefSchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
});

export const trackingSchema = z
  .object({
    completion: z
      .object({
        threshold: z.number().min(0).max(1).default(0.9),
      })
      .optional(),
  })
  .optional();

export const runtimeConfigSchema = z
  .object({
    theme: z.string().default("modern"),
  })
  .optional();

export const courseManifestSchema = z.object({
  title: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  runtime: runtimeConfigSchema,
  tracking: trackingSchema,
  lessons: z.array(lessonSchema).min(1),
  assessments: z.array(assessmentRefSchema).optional(),
});

export type CourseManifest = z.infer<typeof courseManifestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentRef = z.infer<typeof assessmentRefSchema>;
