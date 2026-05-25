export interface AnalyticsReporter {
  onLaunched(): void;
  onExperienced(activityId: string): void;
  onInteraction(id: string, data?: Record<string, unknown>): void;
  onAssessmentSubmitted(id: string, score: number, passed: boolean): void;
  onLessonCompleted(id: string): void;
  onTerminated(): void;
}
