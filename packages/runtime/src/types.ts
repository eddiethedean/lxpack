import type {
  AssessmentRuntimeConfig,
  CourseManifest,
  LearnerAssessment,
  Lesson,
  QuestionFeedback,
  RuntimeAssessmentBundle,
} from "@lxpack/validators";

export interface CourseProgress {
  currentLessonId: string;
  completedLessons: string[];
  assessmentScores: Record<string, number>;
  suspendData: Record<string, unknown>;
}

export interface RuntimeConfig {
  manifest: CourseManifest;
  baseUrl: string;
  mode: "preview" | "standalone" | "scorm12" | "scorm2004";
  activityId?: string;
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
