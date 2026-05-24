import type { CourseProgress } from "../types.js";
import { parseStoredProgress } from "../progress/codec.js";
import type { CompletionState } from "./completion-state.js";
import type { LmsBridge } from "./bridge.js";

/** Preview / standalone: localStorage only, no LMS CMI. */
export class LocalBridge implements LmsBridge {
  constructor(private readonly storageKey: string) {}

  init(): void {
    void 0;
  }

  restoreProgress(defaults: CourseProgress): CourseProgress {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { progress, parsed } = parseStoredProgress(stored, defaults);
        if (parsed) return progress;
      }
    } catch {
      void 0;
    }
    return defaults;
  }

  persist(_progress: CourseProgress, serialized: string): void {
    try {
      localStorage.setItem(this.storageKey, serialized);
    } catch {
      void 0;
    }
  }

  setLocation(_lessonId: string): void {
    void 0;
  }

  applyCompletion(_state: CompletionState): void {
    void 0;
  }

  terminate(): void {
    void 0;
  }
}
