import type { Assessment, ShowFeedback } from "./schemas.js";

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

