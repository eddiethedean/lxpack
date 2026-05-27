import type { Lesson } from "@lxpack/validators";
import type { LxpackRuntime } from "../runtime.js";
import type { RuntimeConfig } from "../types.js";

export type NavItem =
  | { kind: "lesson"; id: string; title: string; lesson: Lesson }
  | { kind: "assessment"; id: string; title: string; file: string };

export type BrowserLessonRenderer = (
  lesson: Lesson,
  ctx: { contentEl: HTMLElement; baseUrl: string },
) => Promise<void>;

declare global {
  interface Window {
    lxpack?: ReturnType<LxpackRuntime["getAPI"]>;
    lxpackBridge?: {
      v1: {
        completeLesson: (lessonId: string) => void;
        submitAssessment: (options: {
          id: string;
          score: number;
          passingScore?: number;
          passed?: boolean;
        }) => void;
        track: (event: unknown) => void;
      };
    };
    __LXPACK_CONFIG__?: RuntimeConfig;
    __LXPACK_LESSON_RENDERERS__?: Record<string, BrowserLessonRenderer>;
    __LXPACK_COMPONENTS__?: {
      mount: (
        el: HTMLElement,
        componentId: string,
        props: Record<string, unknown>,
        baseUrl: string,
      ) => void;
    };
  }
}

export function getConfig(): RuntimeConfig {
  const config = window.__LXPACK_CONFIG__;
  if (!config) {
    throw new Error("LXPack runtime config not found");
  }
  return config;
}
