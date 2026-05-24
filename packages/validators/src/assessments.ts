import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { resolveCoursePath } from "./validate.js";
import {
  assessmentSchema,
  type Assessment,
  type CourseManifest,
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

export interface RuntimeAssessmentBundle {
  assessments: Record<string, LearnerAssessment>;
  answerKeys: Record<string, Record<string, string>>;
}

export function toLearnerAssessment(assessment: Assessment): {
  learner: LearnerAssessment;
  answerKey: Record<string, string>;
} {
  const answerKey: Record<string, string> = {};
  const questions: LearnerQuestion[] = assessment.questions.map((q) => {
    const correct = q.choices.find((c) => c.correct === true);
    if (correct) {
      answerKey[q.id] = correct.id;
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
  };
}

export async function buildRuntimeAssessmentBundle(
  courseDir: string,
  manifest: CourseManifest,
): Promise<RuntimeAssessmentBundle> {
  const assessments: Record<string, LearnerAssessment> = {};
  const answerKeys: Record<string, Record<string, string>> = {};

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
    const { learner, answerKey } = toLearnerAssessment(parsed.data);
    assessments[ref.id] = learner;
    answerKeys[ref.id] = answerKey;
  }

  return { assessments, answerKeys };
}
