import type { CourseManifest } from "@lxpack/validators";
import type { CourseProgress } from "../types.js";
import {
  getAttemptCount,
  incrementAttemptCount,
  isAssessmentPassedFlag,
} from "../quiz/score.js";

export class ProgressState {
  progress: CourseProgress;
  readonly passedAssessments = new Set<string>();

  constructor(
    initial: CourseProgress,
    private readonly manifest: CourseManifest,
    private readonly defaultPassingScores: Record<string, number>,
  ) {
    this.progress = initial;
    this.syncPassedAssessments();
  }

  private getAssessmentPassingScore(assessmentId: string): number {
    const stored = this.progress.suspendData[`assessment_passing_${assessmentId}`];
    if (typeof stored === "number") return stored;
    if (assessmentId in this.defaultPassingScores) {
      return this.defaultPassingScores[assessmentId]!;
    }
    return 0.7;
  }

  syncPassedAssessments(): void {
    this.passedAssessments.clear();
    for (const [id, score] of Object.entries(this.progress.assessmentScores)) {
      if (score >= this.getAssessmentPassingScore(id)) {
        this.passedAssessments.add(id);
      }
    }
    for (const key of Object.keys(this.progress.suspendData)) {
      if (!key.startsWith("assessment_passed_")) continue;
      const id = key.slice("assessment_passed_".length);
      if (isAssessmentPassedFlag(this.progress.suspendData, id)) {
        this.passedAssessments.add(id);
      }
    }
  }

  applyAssessmentResult(
    assessmentId: string,
    score: number,
    passingScore: number,
  ): void {
    this.progress.assessmentScores[assessmentId] = score;
    this.progress.suspendData[`assessment_passing_${assessmentId}`] =
      passingScore;
    const passed = score >= passingScore;
    this.progress.suspendData[`assessment_passed_${assessmentId}`] = passed;
    if (passed) {
      delete this.progress.suspendData[`assessment_exhausted_${assessmentId}`];
      this.passedAssessments.add(assessmentId);
    } else {
      this.passedAssessments.delete(assessmentId);
    }
  }

  recordAssessmentAttempt(assessmentId: string): number {
    return incrementAttemptCount(this.progress.suspendData, assessmentId);
  }

  getAssessmentAttemptCount(assessmentId: string): number {
    return getAttemptCount(this.progress.suspendData, assessmentId);
  }

  completeLesson(lessonId: string): void {
    const validIds = new Set(this.manifest.lessons.map((l) => l.id));
    if (!validIds.has(lessonId)) return;
    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }
  }

  setCurrentLesson(lessonId: string): void {
    this.progress.currentLessonId = lessonId;
  }

  isLessonComplete(lessonId: string): boolean {
    return this.progress.completedLessons.includes(lessonId);
  }

  isAssessmentPassed(assessmentId: string): boolean {
    return this.passedAssessments.has(assessmentId);
  }

  getAssessmentPassingScoreForTrack(assessmentId: string): number {
    return this.getAssessmentPassingScore(assessmentId);
  }
}
