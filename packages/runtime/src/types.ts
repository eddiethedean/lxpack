import type { CourseManifest, Lesson } from "@lxpack/validators";

export interface CourseProgress {
  currentLessonId: string;
  completedLessons: string[];
  assessmentScores: Record<string, number>;
  suspendData: Record<string, unknown>;
}

export interface RuntimeConfig {
  manifest: CourseManifest;
  baseUrl: string;
  mode: "preview" | "standalone" | "scorm12";
  progress?: CourseProgress;
}

export interface TrackEvent {
  type: string;
  id?: string;
  data?: Record<string, unknown>;
}

export interface LxpackAPI {
  track: (event: TrackEvent) => void;
  completeLesson: (lessonId: string) => void;
  getProgress: () => CourseProgress;
  setVariable: (key: string, value: unknown) => void;
  getVariable: (key: string) => unknown;
  submitAssessment: (
    assessmentId: string,
    score: number,
    passingScore: number,
  ) => void;
}

export type { CourseManifest, Lesson };
