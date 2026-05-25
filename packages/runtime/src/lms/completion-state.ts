export interface CompletionState {
  ratio: number;
  scorePercent: number;
  allLessonsComplete: boolean;
  allAssessmentsPassed: boolean;
  anyAssessmentFailed: boolean;
  hasAssessments: boolean;
  /** True when the learner has completed a lesson, attempted a quiz, or passed an assessment. */
  hasLearnerProgress: boolean;
  completionThreshold: number;
}
