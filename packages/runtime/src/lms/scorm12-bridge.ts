import type { CourseProgress } from "../types.js";
import type { ScormConnection } from "../scorm-api.js";
import { parseStoredProgress } from "../progress/codec.js";
import type { CompletionState } from "./completion-state.js";
import type { LmsBridge } from "./bridge.js";

export class Scorm12Bridge implements LmsBridge {
  constructor(private readonly connection: ScormConnection) {}

  init(): void {
    this.connection.LMSInitialize();
  }

  restoreProgress(defaults: CourseProgress): CourseProgress {
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
    this.connection.setSuspendData(serialized);
    this.connection.LMSCommit();
  }

  setLocation(lessonId: string): void {
    this.connection.setLessonLocation(lessonId);
  }

  applyCompletion(state: CompletionState): void {
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
    this.connection.LMSFinish();
  }
}
