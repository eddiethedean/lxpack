import type {
  CourseManifest,
  CourseProgress,
  LxpackAPI,
  RuntimeConfig,
  TrackEvent,
} from "./types.js";
import {
  type ScormConnection,
  createScormConnection,
  trimSuspendData,
} from "./scorm-api.js";

function progressStorageKey(manifest: CourseManifest): string {
  const slug = `${manifest.title}::${manifest.version}`;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return `lxpack_progress_${Math.abs(hash)}`;
}

function mergeProgress(
  base: CourseProgress,
  saved: Partial<CourseProgress>,
): CourseProgress {
  return {
    ...base,
    ...saved,
    completedLessons: saved.completedLessons ?? base.completedLessons,
    assessmentScores: {
      ...base.assessmentScores,
      ...saved.assessmentScores,
    },
    suspendData: {
      ...base.suspendData,
      ...saved.suspendData,
    },
  };
}

export class LxpackRuntime {
  private manifest: CourseManifest;
  private progress: CourseProgress;
  private scorm: ScormConnection | null = null;
  private completionThreshold: number;
  private storageKey: string;
  private mode: RuntimeConfig["mode"];
  private passedAssessments = new Set<string>();

  constructor(config: RuntimeConfig) {
    this.manifest = config.manifest;
    this.mode = config.mode;
    this.completionThreshold =
      config.manifest.tracking?.completion?.threshold ?? 0.9;
    this.storageKey = progressStorageKey(config.manifest);

    const firstLesson = config.manifest.lessons[0]?.id ?? "";
    this.progress = config.progress ?? {
      currentLessonId: firstLesson,
      completedLessons: [],
      assessmentScores: {},
      suspendData: {},
    };

    if (config.mode === "scorm12") {
      this.scorm = createScormConnection("scorm12");
      this.scorm.LMSInitialize();
      this.restoreScormProgress();
    } else if (config.mode === "preview" || config.mode === "standalone") {
      this.restoreLocalProgress();
    }
  }

  private restoreScormProgress(): void {
    if (!this.scorm) return;

    const saved = this.scorm.LMSGetValue("cmi.suspend_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<CourseProgress>;
        this.progress = mergeProgress(this.progress, parsed);
      } catch {
        // use defaults
      }
    } else {
      const location = this.scorm.LMSGetValue("cmi.core.lesson_location");
      if (location) {
        this.progress.currentLessonId = location;
      }
    }

    this.syncPassedAssessments();
  }

  private restoreLocalProgress(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CourseProgress>;
        this.progress = mergeProgress(this.progress, parsed);
      }
    } catch {
      void 0;
    }
    this.syncPassedAssessments();
  }

  private syncPassedAssessments(): void {
    this.passedAssessments.clear();
    for (const [id, score] of Object.entries(this.progress.assessmentScores)) {
      if (score >= this.getAssessmentPassingScore(id)) {
        this.passedAssessments.add(id);
      }
    }
  }

  private getAssessmentPassingScore(assessmentId: string): number {
    const ref = this.manifest.assessments?.find((a) => a.id === assessmentId);
    if (!ref) return 0.7;
    const stored = this.progress.suspendData[`assessment_passing_${assessmentId}`];
    if (typeof stored === "number") return stored;
    return 0.7;
  }

  getAPI(): LxpackAPI {
    return {
      track: (event) => this.track(event),
      completeLesson: (lessonId) => this.completeLesson(lessonId),
      getProgress: () => ({ ...this.progress }),
      setVariable: (key, value) => {
        this.progress.suspendData[key] = value;
        this.persist();
      },
      getVariable: (key) => this.progress.suspendData[key],
      submitAssessment: (assessmentId, score, passingScore) =>
        this.submitAssessment(assessmentId, score, passingScore),
    };
  }

  track(event: TrackEvent): void {
    if (event.type === "interaction" && event.id) {
      this.progress.suspendData[`interaction_${event.id}`] =
        event.data ?? true;
      console.debug("[lxpack] interaction:", event.id, event.data);
    }
    if (event.type === "assessment" && event.id && event.data?.score != null) {
      const score = Number(event.data.score);
      this.progress.assessmentScores[event.id] = score;
    }
    this.persist();
  }

  submitAssessment(
    assessmentId: string,
    score: number,
    passingScore: number,
  ): void {
    this.progress.assessmentScores[assessmentId] = score;
    this.progress.suspendData[`assessment_passing_${assessmentId}`] =
      passingScore;
    if (score >= passingScore) {
      this.passedAssessments.add(assessmentId);
    } else {
      this.passedAssessments.delete(assessmentId);
    }
    this.track({
      type: "assessment",
      id: assessmentId,
      data: { score, passingScore, passed: score >= passingScore },
    });
    this.updateCompletion();
  }

  completeLesson(lessonId: string): void {
    const validIds = new Set(this.manifest.lessons.map((l) => l.id));
    if (!validIds.has(lessonId)) return;

    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }
    this.updateCompletion();
    this.persist();
  }

  setCurrentLesson(lessonId: string): void {
    this.progress.currentLessonId = lessonId;
    if (this.scorm) {
      this.scorm.setLessonLocation(lessonId);
    }
    this.persist();
  }

  getProgress(): CourseProgress {
    return { ...this.progress };
  }

  getManifest(): CourseManifest {
    return this.manifest;
  }

  isLessonComplete(lessonId: string): boolean {
    return this.progress.completedLessons.includes(lessonId);
  }

  isAssessmentPassed(assessmentId: string): boolean {
    return this.passedAssessments.has(assessmentId);
  }

  getTotalUnits(): number {
    const assessments = this.manifest.assessments?.length ?? 0;
    return this.manifest.lessons.length + assessments;
  }

  getCompletionRatio(): number {
    const total = this.getTotalUnits();
    if (total === 0) return 0;

    const lessonCount = this.manifest.lessons.length;
    const assessmentCount = this.manifest.assessments?.length ?? 0;
    const completedLessons = this.progress.completedLessons.filter((id) =>
      this.manifest.lessons.some((l) => l.id === id),
    ).length;
    const completedAssessments = this.passedAssessments.size;

    return (completedLessons + completedAssessments) / (lessonCount + assessmentCount);
  }

  private updateCompletion(): void {
    const ratio = this.getCompletionRatio();
    const score = Math.round(ratio * 100);

    if (this.scorm) {
      this.scorm.setScore(score);
      const allLessonsComplete = this.manifest.lessons.every((l) =>
        this.progress.completedLessons.includes(l.id),
      );
      const allAssessmentsPassed =
        !this.manifest.assessments?.length ||
        this.manifest.assessments.every((a) => this.passedAssessments.has(a.id));
      const anyAssessmentFailed = this.manifest.assessments?.some(
        (a) =>
          a.id in this.progress.assessmentScores &&
          !this.passedAssessments.has(a.id),
      );

      if (anyAssessmentFailed) {
        this.scorm.setLessonStatus("failed");
      } else if (
        ratio >= this.completionThreshold &&
        allLessonsComplete &&
        allAssessmentsPassed
      ) {
        this.scorm.setLessonStatus(
          (this.manifest.assessments?.length ?? 0) > 0 ? "passed" : "completed",
        );
      } else if (score > 0) {
        this.scorm.setLessonStatus("incomplete");
      }
    }
  }

  private persist(): void {
    const data = trimSuspendData(JSON.stringify(this.progress));

    if (this.mode === "preview" || this.mode === "standalone") {
      try {
        localStorage.setItem(this.storageKey, data);
      } catch {
        void 0;
      }
    }

    if (this.scorm) {
      this.scorm.setSuspendData(data);
      this.scorm.LMSCommit();
    }
  }

  terminate(): void {
    if (this.scorm) {
      this.scorm.LMSFinish();
    }
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
export type { CourseManifest, CourseProgress, LxpackAPI, RuntimeConfig, TrackEvent };
