import type { CourseProgress } from "../types.js";
import type { CompletionState } from "./completion-state.js";

export interface LmsBridge {
  init(): void;
  restoreProgress(defaults: CourseProgress): CourseProgress;
  persist(progress: CourseProgress, serialized: string): void;
  setLocation(lessonId: string): void;
  applyCompletion(state: CompletionState): void;
  terminate(): void;
}
