import type { CourseProgress } from "../types.js";
import type { Scorm2004Connection } from "../scorm2004-api.js";
import { parseStoredProgress } from "../progress/codec.js";
import type { CompletionState } from "./completion-state.js";
import type { LmsBridge } from "./bridge.js";

export class Scorm2004Bridge implements LmsBridge {
  constructor(private readonly connection: Scorm2004Connection) {}

  init(): void {
    this.connection.Initialize();
  }

  restoreProgress(defaults: CourseProgress): CourseProgress {
    const saved = this.connection.GetValue("cmi.suspend_data");
    if (saved) {
      const { progress, parsed } = parseStoredProgress(saved, defaults);
      if (parsed) return progress;
      console.warn(
        "[lxpack] suspend_data could not be parsed; using cmi.location only",
      );
      const location = this.connection.GetValue("cmi.location");
      if (location) {
        return { ...defaults, currentLessonId: location };
      }
      return defaults;
    }
    const location = this.connection.GetValue("cmi.location");
    if (location) {
      return { ...defaults, currentLessonId: location };
    }
    return defaults;
  }

  persist(_progress: CourseProgress, serialized: string): void {
    this.connection.setSuspendData(serialized);
    this.connection.Commit();
  }

  setLocation(lessonId: string): void {
    this.connection.setLocation(lessonId);
  }

  applyCompletion(state: CompletionState): void {
    this.connection.setScoreScaled(state.ratio);
    if (state.anyAssessmentFailed) {
      this.connection.setSuccessStatus("failed");
      this.connection.setCompletionStatus("incomplete");
    } else if (
      state.ratio >= state.completionThreshold &&
      state.allLessonsComplete &&
      state.allAssessmentsPassed
    ) {
      this.connection.setSuccessStatus("passed");
      this.connection.setCompletionStatus("completed");
    } else if (
      state.ratio > 0 ||
      (state.hasAssessments &&
        !state.allAssessmentsPassed &&
        !state.anyAssessmentFailed)
    ) {
      this.connection.setCompletionStatus("incomplete");
      this.connection.setSuccessStatus("unknown");
    } else {
      this.connection.setCompletionStatus("incomplete");
      this.connection.setSuccessStatus("unknown");
    }
  }

  terminate(): void {
    this.connection.Terminate();
  }
}
