import type { AnalyticsReporter } from "./reporter.js";

export class NoopReporter implements AnalyticsReporter {
  onLaunched(): void {}
  onExperienced(_activityId: string): void {}
  onInteraction(_id: string, _data?: Record<string, unknown>): void {}
  onAssessmentSubmitted(_id: string, _score: number, _passed: boolean): void {}
  onLessonCompleted(_id: string): void {}
  onTerminated(): void {}
}
