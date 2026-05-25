import type {
  AssessmentRuntimeConfig,
  CourseManifest,
  LearnerAssessment,
  Lesson,
  QuestionFeedback,
  RuntimeAssessmentBundle,
} from "@lxpack/validators";

/** Preview LMS persistence: localStorage vs SCORM 1.2/2004 simulators. */
export type PreviewScormMode = "local" | "scorm12" | "scorm2004";

export interface CourseProgress {
  currentLessonId: string;
  completedLessons: string[];
  assessmentScores: Record<string, number>;
  suspendData: Record<string, unknown>;
}

export interface RuntimeConfig {
  manifest: CourseManifest;
  baseUrl: string;
  mode: "preview" | "standalone" | "scorm12" | "scorm2004" | "xapi" | "cmi5";
  /** When mode is preview: local (default) or SCORM API simulators. */
  previewScormMode?: PreviewScormMode;
  activityId?: string;
  activityIri?: string;
  xapi?: {
    previewLog?: boolean;
    mockLrs?: boolean;
  };
  progress?: CourseProgress;
  assessments?: RuntimeAssessmentBundle["assessments"];
  answerKeys?: RuntimeAssessmentBundle["answerKeys"];
  assessmentConfigs?: Record<string, AssessmentRuntimeConfig>;
  assessmentFeedback?: Record<string, QuestionFeedback>;
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

export type { CourseManifest, LearnerAssessment, Lesson };
