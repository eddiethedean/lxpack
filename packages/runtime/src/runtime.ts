import type {
  CourseManifest,
  CourseProgress,
  LxpackAPI,
  RuntimeConfig,
  TrackEvent,
} from "./types.js";
import { serializeProgressForStorage } from "./progress/size-policy.js";
import {
  initManifestVariables,
  readManifestVariable,
  writeManifestVariable,
} from "./variables.js";
import type { FlowContext } from "./flow.js";
import { resolveFlowGoto } from "./flow.js";
import type { AssessmentRuntimeConfig } from "@lxpack/validators";
import { DEFAULT_ASSESSMENT_CONFIG } from "./quiz/types.js";
import type { LmsBridge } from "./lms/bridge.js";
import { createLmsBridge, progressStorageKey } from "./lms/factory.js";
import { ProgressState } from "./core/progress-state.js";
import { buildCompletionState } from "./core/completion-evaluator.js";
import type { AssessmentHost } from "./quiz/host.js";
import { createAnalyticsReporter } from "./analytics/factory.js";
import type { AnalyticsReporter } from "./analytics/reporter.js";

export class LxpackRuntime implements AssessmentHost {
  private manifest: CourseManifest;
  private state: ProgressState;
  private bridge: LmsBridge;
  private analytics: AnalyticsReporter;
  private completionThreshold: number;
  private assessmentConfigs: Record<string, AssessmentRuntimeConfig>;
  private defaultPassingScores: Record<string, number>;
  private terminated = false;

  constructor(config: RuntimeConfig) {
    this.manifest = config.manifest;
    this.completionThreshold =
      config.manifest.tracking?.completion?.threshold ?? 0.9;
    const storageKey = progressStorageKey(
      config.manifest.title,
      config.manifest.version,
    );
    this.bridge = createLmsBridge(
      config.mode,
      storageKey,
      config.previewScormMode ?? "local",
    );
    this.analytics = createAnalyticsReporter(config);

    this.defaultPassingScores = {};
    for (const [id, assessment] of Object.entries(config.assessments ?? {})) {
      this.defaultPassingScores[id] = assessment.passingScore;
    }
    this.assessmentConfigs = config.assessmentConfigs ?? {};

    const firstLesson =
      config.activityId ?? config.manifest.lessons[0]?.id ?? "";
    const initialProgress: CourseProgress = config.progress ?? {
      currentLessonId: firstLesson,
      completedLessons: [],
      assessmentScores: {},
      suspendData: {},
    };

    initManifestVariables(this.manifest, initialProgress.suspendData);

    this.bridge.init();
    const restored = this.bridge.restoreProgress(initialProgress);
    this.state = new ProgressState(
      restored,
      this.manifest,
      this.defaultPassingScores,
    );
    initManifestVariables(this.manifest, this.state.progress.suspendData);
    this.state.syncPassedAssessments();

    if (config.activityId) {
      this.state.setCurrentLesson(config.activityId);
    }

    this.analytics.onLaunched();
    this.analytics.onExperienced(this.state.progress.currentLessonId);
  }

  getAPI(): LxpackAPI {
    return {
      track: (event) => this.track(event),
      completeLesson: (lessonId) => this.completeLesson(lessonId),
      getProgress: () => this.getProgress(),
      setVariable: (key, value) => {
        if (this.manifest.variables && key in this.manifest.variables) {
          writeManifestVariable(this.state.progress.suspendData, key, value);
        } else {
          this.state.progress.suspendData[key] = value;
        }
        this.persist();
      },
      getVariable: (key) => {
        if (this.manifest.variables && key in this.manifest.variables) {
          return readManifestVariable(this.state.progress.suspendData, key);
        }
        return this.state.progress.suspendData[key];
      },
      submitAssessment: (assessmentId, score, passingScore) =>
        this.submitAssessment(assessmentId, score, passingScore),
    };
  }

  track(event: TrackEvent, options?: { persist?: boolean }): void {
    if (event.type === "interaction" && event.id) {
      this.state.progress.suspendData[`interaction_${event.id}`] =
        event.data ?? true;
      console.debug("[lxpack] interaction:", event.id, event.data);
      this.analytics.onInteraction(
        event.id,
        event.data as Record<string, unknown> | undefined,
      );
    }
    if (event.type === "simulation" && event.id) {
      this.analytics.onInteraction(event.id, {
        type: "simulation",
        simulation: event.data ?? {},
      });
    }
    if (event.type === "assessment" && event.id) {
      const passingScore =
        typeof event.data?.passingScore === "number"
          ? Number(event.data.passingScore)
          : this.state.getAssessmentPassingScoreForTrack(event.id);
      const score =
        event.data?.score != null ? Number(event.data.score) : undefined;
      if (score != null && !Number.isNaN(score)) {
        this.submitAssessment(event.id, score, passingScore);
        return;
      }
    }
    if (options?.persist !== false) {
      this.persist();
    }
  }

  recordAssessmentAttempt(assessmentId: string): number {
    return this.state.recordAssessmentAttempt(assessmentId);
  }

  getAssessmentAttemptCount(assessmentId: string): number {
    return this.state.getAssessmentAttemptCount(assessmentId);
  }

  submitAssessment(
    assessmentId: string,
    score: number,
    passingScore: number,
  ): void {
    if (!this.canAcceptAssessmentSubmission(assessmentId)) {
      return;
    }
    this.state.recordAssessmentAttempt(assessmentId);
    this.state.applyAssessmentResult(assessmentId, score, passingScore);
    const passed = this.isAssessmentPassed(assessmentId);
    this.analytics.onAssessmentSubmitted(assessmentId, score, passed);
    this.updateCompletion();
    this.persist();
  }

  private getMaxAttempts(assessmentId: string): number {
    const config = this.assessmentConfigs[assessmentId];
    return config?.maxAttempts ?? DEFAULT_ASSESSMENT_CONFIG.maxAttempts;
  }

  private canAcceptAssessmentSubmission(assessmentId: string): boolean {
    if (this.isAssessmentPassed(assessmentId)) {
      return false;
    }
    const maxAttempts = this.getMaxAttempts(assessmentId);
    return this.getAssessmentAttemptCount(assessmentId) < maxAttempts;
  }

  completeLesson(lessonId: string): void {
    this.state.completeLesson(lessonId);
    this.analytics.onLessonCompleted(lessonId);
    this.updateCompletion();
    this.persist();
  }

  setCurrentLesson(lessonId: string): void {
    this.state.setCurrentLesson(lessonId);
    this.bridge.setLocation(lessonId);
    this.analytics.onExperienced(lessonId);
    this.persist();
  }

  getProgress(): CourseProgress {
    const p = this.state.progress;
    return {
      ...p,
      completedLessons: [...p.completedLessons],
      assessmentScores: { ...p.assessmentScores },
      suspendData: { ...p.suspendData },
    };
  }

  getManifest(): CourseManifest {
    return this.manifest;
  }

  isLessonComplete(lessonId: string): boolean {
    return this.state.isLessonComplete(lessonId);
  }

  isAssessmentPassed(assessmentId: string): boolean {
    return this.state.isAssessmentPassed(assessmentId);
  }

  getTotalUnits(): number {
    const assessments = this.manifest.assessments?.length ?? 0;
    return this.manifest.lessons.length + assessments;
  }

  getCompletionRatio(): number {
    return buildCompletionState(this.state.progress, {
      manifest: this.manifest,
      completionThreshold: this.completionThreshold,
      assessmentConfigs: this.assessmentConfigs,
      defaultPassingScores: this.defaultPassingScores,
      passedAssessments: this.state.passedAssessments,
    }).ratio;
  }

  private updateCompletion(): void {
    const completion = buildCompletionState(this.state.progress, {
      manifest: this.manifest,
      completionThreshold: this.completionThreshold,
      assessmentConfigs: this.assessmentConfigs,
      defaultPassingScores: this.defaultPassingScores,
      passedAssessments: this.state.passedAssessments,
    });
    this.bridge.applyCompletion(completion);
  }

  private persist(): void {
    const data = serializeProgressForStorage(this.state.progress);
    this.bridge.persist(this.state.progress, data);
  }

  getFlowContext(): FlowContext {
    return {
      getVariable: (name) =>
        readManifestVariable(this.state.progress.suspendData, name),
      getVariableType: (name) =>
        this.manifest.variables?.[name]?.type,
      isAssessmentPassed: (id) => this.isAssessmentPassed(id),
      isInteractionDone: (id) => {
        const value = this.state.progress.suspendData[`interaction_${id}`];
        return value !== undefined && value !== false && value !== null;
      },
    };
  }

  resolveFlowNavigation(): string | null {
    return resolveFlowGoto(this.manifest, this.getFlowContext());
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.analytics.onTerminated();
    this.bridge.terminate();
  }
}

export {
  createScormConnection,
  findLmsApi,
  Scorm12Adapter,
  Scorm12Simulator,
  Scorm12API,
  installScormAPI,
  trimSuspendData,
} from "./scorm-api.js";
export { SCORM_SUSPEND_DATA_MAX } from "./progress/constants.js";
export type { CourseManifest, CourseProgress, LxpackAPI, RuntimeConfig, TrackEvent };
export type { LmsBridge } from "./lms/bridge.js";
export type { AssessmentHost } from "./quiz/host.js";
