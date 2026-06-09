import type { Assessment, ShowFeedback } from "./schemas.js";

export interface LearnerChoice {
  id: string;
  text: string;
}

export type SelectionMode = "single" | "multiple";

export type AnswerKeyValue = string | string[];

export interface LearnerQuestion {
  id: string;
  prompt: string;
  choices: LearnerChoice[];
  selectionMode?: SelectionMode;
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
  answerKeys: Record<string, Record<string, AnswerKeyValue>>;
  configs: Record<string, AssessmentRuntimeConfig>;
  feedback: Record<string, QuestionFeedback>;
}

function resolveSelectionMode(
  question: Assessment["questions"][number],
  correctChoices: Array<{ id: string }>,
): SelectionMode {
  return (
    question.selectionMode ??
    (correctChoices.length > 1 ? "multiple" : "single")
  );
}

export function toLearnerAssessment(assessment: Assessment): {
  learner: LearnerAssessment;
  answerKey: Record<string, AnswerKeyValue>;
  config: AssessmentRuntimeConfig;
  feedback: QuestionFeedback;
} {
  const answerKey: Record<string, AnswerKeyValue> = {};
  const feedback: QuestionFeedback = {};
  const questions: LearnerQuestion[] = assessment.questions.map((q) => {
    const correctChoices = q.choices.filter((c) => c.correct === true);
    const selectionMode = resolveSelectionMode(q, correctChoices);
    if (selectionMode === "multiple") {
      answerKey[q.id] = correctChoices.map((c) => c.id);
    } else if (correctChoices[0]) {
      answerKey[q.id] = correctChoices[0].id;
    }
    if (q.explanation) {
      feedback[q.id] = q.explanation;
    }
    return {
      id: q.id,
      prompt: q.prompt,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      selectionMode,
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

