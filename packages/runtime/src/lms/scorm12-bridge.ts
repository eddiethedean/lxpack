import type { CourseProgress } from "../types.js";
import type { ScormConnection } from "../scorm-api.js";
import { parseStoredProgress } from "../progress/codec.js";
import type { CompletionState } from "./completion-state.js";
import type { LmsBridge } from "./bridge.js";

export class Scorm12Bridge implements LmsBridge {
  private sessionReady = false;

  constructor(private readonly connection: ScormConnection) {}

  init(): void {
    const ok = this.connection.LMSInitialize() === "true";
    if (!ok) {
      console.warn(
        "[lxpack] SCORM 1.2 LMSInitialize failed; progress will not persist to the LMS",
      );
      this.sessionReady = false;
      return;
    }
    this.sessionReady = true;
  }

  restoreProgress(defaults: CourseProgress): CourseProgress {
    if (!this.sessionReady) {
      return defaults;
    }
    const saved = this.connection.LMSGetValue("cmi.suspend_data");
    if (saved) {
      const { progress, parsed } = parseStoredProgress(saved, defaults);
      if (parsed) return progress;
      console.warn(
        "[lxpack] suspend_data could not be parsed; using lesson_location only",
      );
      const location = this.connection.LMSGetValue("cmi.core.lesson_location");
      if (location) {
        return { ...defaults, currentLessonId: location };
      }
      return defaults;
    }
    const location = this.connection.LMSGetValue("cmi.core.lesson_location");
    if (location) {
      return { ...defaults, currentLessonId: location };
    }
    return defaults;
  }

  persist(_progress: CourseProgress, serialized: string): void {
    if (!this.sessionReady) {
      return;
    }
    this.connection.setSuspendData(serialized);
    if (this.connection.LMSCommit() !== "true") {
      console.warn("[lxpack] SCORM 1.2 LMSCommit failed");
    }
  }

  setLocation(lessonId: string): void {
    if (!this.sessionReady) {
      return;
    }
    this.connection.setLessonLocation(lessonId);
  }

  applyCompletion(state: CompletionState): void {
    if (!this.sessionReady) {
      return;
    }
    this.connection.setScore(state.scorePercent);
    if (state.anyAssessmentFailed) {
      this.connection.setLessonStatus("failed");
    } else if (
      state.ratio >= state.completionThreshold &&
      state.allLessonsComplete &&
      state.allAssessmentsPassed
    ) {
      this.connection.setLessonStatus(
        state.hasAssessments ? "passed" : "completed",
      );
    } else if (state.hasLearnerProgress) {
      this.connection.setLessonStatus("incomplete");
    } else {
      this.connection.setLessonStatus("incomplete");
    }
  }

  terminate(): void {
    if (!this.sessionReady) {
      return;
    }
    if (this.connection.LMSFinish() !== "true") {
      console.warn("[lxpack] SCORM 1.2 LMSFinish failed");
    }
    this.sessionReady = false;
  }
}
