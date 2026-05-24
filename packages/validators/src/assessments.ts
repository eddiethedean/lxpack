import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { resolveCoursePath } from "./validate.js";
import {
  assessmentSchema,
  type Assessment,
  type CourseManifest,
  type ShowFeedback,
} from "./schemas.js";

export interface LearnerChoice {
  id: string;
  text: string;
}

export interface LearnerQuestion {
  id: string;
  prompt: string;
  choices: LearnerChoice[];
}

export interface LearnerAssessment {
  id: string;
  title?: string;
  passingScore: number;
  questions: LearnerQuestion[];
}

export interface AssessmentRuntimeConfig {
  maxAttempts: number;
  shuffleChoices: boolean;
  showFeedback: ShowFeedback;
}

export interface QuestionFeedback {
  [questionId: string]: string | undefined;
}

export interface RuntimeAssessmentBundle {
  assessments: Record<string, LearnerAssessment>;
  answerKeys: Record<string, Record<string, string>>;
  configs: Record<string, AssessmentRuntimeConfig>;
  feedback: Record<string, QuestionFeedback>;
}

export function toLearnerAssessment(assessment: Assessment): {
  learner: LearnerAssessment;
  answerKey: Record<string, string>;
  config: AssessmentRuntimeConfig;
  feedback: QuestionFeedback;
} {
  const answerKey: Record<string, string> = {};
  const feedback: QuestionFeedback = {};
  const questions: LearnerQuestion[] = assessment.questions.map((q) => {
    const correct = q.choices.find((c) => c.correct === true);
    if (correct) {
      answerKey[q.id] = correct.id;
    }
    if (q.explanation) {
      feedback[q.id] = q.explanation;
    }
    return {
      id: q.id,
      prompt: q.prompt,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    };
  });

  return {
    learner: {
      id: assessment.id,
      title: assessment.title,
      passingScore: assessment.passingScore,
      questions,
    },
    answerKey,
    config: {
      maxAttempts: assessment.maxAttempts ?? 1,
      shuffleChoices: assessment.shuffleChoices ?? false,
      showFeedback: assessment.showFeedback ?? "never",
    },
    feedback,
  };
}

export async function buildRuntimeAssessmentBundle(
  courseDir: string,
  manifest: CourseManifest,
): Promise<RuntimeAssessmentBundle> {
  const assessments: Record<string, LearnerAssessment> = {};
  const answerKeys: Record<string, Record<string, string>> = {};
  const configs: Record<string, AssessmentRuntimeConfig> = {};
  const feedback: Record<string, QuestionFeedback> = {};

  for (const ref of manifest.assessments ?? []) {
    const resolved = resolveCoursePath(courseDir, ref.file);
    if (!resolved.ok) {
      throw new Error(resolved.message);
    }
    const content = await readFile(resolved.path, "utf-8");
    const raw = parseYaml(content);
    const parsed = assessmentSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid assessment ${ref.file}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
    }
    if (parsed.data.id !== ref.id) {
      throw new Error(
        `Assessment file id "${parsed.data.id}" does not match manifest ref "${ref.id}"`,
      );
    }
    const built = toLearnerAssessment(parsed.data);
    assessments[ref.id] = built.learner;
    answerKeys[ref.id] = built.answerKey;
    configs[ref.id] = built.config;
    feedback[ref.id] = built.feedback;
  }

  return { assessments, answerKeys, configs, feedback };
}
