import type { CourseProgress } from "../types.js";
import type { LmsBridge } from "./bridge.js";

export class NoOpBridge implements LmsBridge {
  init(): void {
    void 0;
  }

  restoreProgress(defaults: CourseProgress): CourseProgress {
    return defaults;
  }

  persist(): void {
    void 0;
  }

  setLocation(): void {
    void 0;
  }

  applyCompletion(): void {
    void 0;
  }

  terminate(): void {
    void 0;
  }
}
