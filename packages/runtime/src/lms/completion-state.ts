export interface CompletionState {
  ratio: number;
  scorePercent: number;
  allLessonsComplete: boolean;
  allAssessmentsPassed: boolean;
  anyAssessmentFailed: boolean;
  hasAssessments: boolean;
  completionThreshold: number;
}
