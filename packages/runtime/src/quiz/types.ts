import type { LearnerAssessment, ShowFeedback } from "@lxpack/validators";

export interface AssessmentRuntimeConfig {
  maxAttempts: number;
  shuffleChoices: boolean;
  showFeedback: ShowFeedback;
}

export interface QuestionFeedback {
  [questionId: string]: string | undefined;
}

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentRuntimeConfig = {
  maxAttempts: 1,
  shuffleChoices: false,
  showFeedback: "never",
};

export interface RuntimeAssessmentPayload extends LearnerAssessment {
  config?: Partial<AssessmentRuntimeConfig>;
  feedback?: QuestionFeedback;
}
