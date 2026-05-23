import type {
  CourseManifest,
  CourseProgress,
  LxpackAPI,
  RuntimeConfig,
  TrackEvent,
} from "./types.js";
import { Scorm12API, installScormAPI } from "./scorm-api.js";

export class LxpackRuntime {
  private manifest: CourseManifest;
  private progress: CourseProgress;
  private scorm: Scorm12API | null = null;
  private completionThreshold: number;

  constructor(config: RuntimeConfig) {
    this.manifest = config.manifest;
    this.completionThreshold =
      config.manifest.tracking?.completion?.threshold ?? 0.9;

    const firstLesson = config.manifest.lessons[0]?.id ?? "";
    this.progress = config.progress ?? {
      currentLessonId: firstLesson,
      completedLessons: [],
      assessmentScores: {},
      suspendData: {},
    };

    if (config.mode === "scorm12") {
      this.scorm = installScormAPI();
      this.scorm.LMSInitialize();
      const saved = this.scorm.LMSGetValue("cmi.suspend_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CourseProgress;
          this.progress = { ...this.progress, ...parsed };
        } catch {
          // use defaults
        }
      }
    }
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
    };
  }

  track(event: TrackEvent): void {
    if (event.type === "interaction" && event.id) {
      console.debug("[lxpack] interaction:", event.id, event.data);
    }
    this.persist();
  }

  completeLesson(lessonId: string): void {
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

  getCompletionRatio(): number {
    const total = this.manifest.lessons.length;
    if (total === 0) return 0;
    return this.progress.completedLessons.length / total;
  }

  private updateCompletion(): void {
    const ratio = this.getCompletionRatio();
    const score = Math.round(ratio * 100);

    if (this.scorm) {
      this.scorm.setScore(score);
      if (ratio >= this.completionThreshold) {
        this.scorm.setLessonStatus("completed");
      } else {
        this.scorm.setLessonStatus("incomplete");
      }
    }
  }

  private persist(): void {
    const data = JSON.stringify(this.progress);
    try {
      localStorage.setItem("lxpack_progress", data);
    } catch {
      void 0;
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

export { installScormAPI, Scorm12API };
export type { CourseManifest, CourseProgress, LxpackAPI, RuntimeConfig, TrackEvent };
