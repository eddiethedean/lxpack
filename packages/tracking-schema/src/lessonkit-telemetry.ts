import {
  TRACK_EVENT_ASSESSMENT,
  TRACK_EVENT_INTERACTION,
  type TrackEventType,
} from "./index.js";

export const LESSONKIT_TELEMETRY_EVENTS = [
  "course_started",
  "course_completed",
  "lesson_started",
  "lesson_completed",
  "quiz_answered",
  "quiz_completed",
  "interaction",
] as const;

export type LessonkitTelemetryEventName =
  (typeof LESSONKIT_TELEMETRY_EVENTS)[number];

export type LessonkitTelemetryEvent = {
  name: LessonkitTelemetryEventName;
  lessonId?: string;
  assessmentId?: string;
  score?: number;
  maxScore?: number;
  passingScore?: number;
  data?: Record<string, unknown>;
};

export type TrackingSchemaEvent = {
  type: TrackEventType;
  id: string;
  data?: Record<string, unknown>;
};

export type LessonkitBridgeAction =
  | { kind: "completeLesson"; lessonId: string }
  | {
      kind: "submitAssessment";
      id: string;
      score: number;
      passingScore?: number;
      maxScore?: number;
    }
  | { kind: "track"; event: TrackingSchemaEvent };

export function mapLessonkitTelemetryToLxpack(
  event: LessonkitTelemetryEvent,
): TrackingSchemaEvent | null {
  switch (event.name) {
    case "interaction":
      return {
        type: TRACK_EVENT_INTERACTION,
        id: event.lessonId ?? "interaction",
        data: event.data,
      };
    case "quiz_answered":
    case "quiz_completed":
      return {
        type: TRACK_EVENT_ASSESSMENT,
        id: event.assessmentId ?? "quiz",
        data: {
          score: event.score,
          passingScore: event.passingScore,
          maxScore: event.maxScore,
          ...event.data,
        },
      };
    case "course_started":
    case "course_completed":
    case "lesson_started":
    case "lesson_completed":
      return null;
    default:
      return null;
  }
}

export function mapLessonkitTelemetryToBridgeAction(
  event: LessonkitTelemetryEvent,
): LessonkitBridgeAction | null {
  switch (event.name) {
    case "lesson_completed":
      return event.lessonId
        ? { kind: "completeLesson", lessonId: event.lessonId }
        : null;
    case "quiz_completed":
      return event.assessmentId != null && typeof event.score === "number"
        ? {
            kind: "submitAssessment",
            id: event.assessmentId,
            score: event.score,
            passingScore: event.passingScore,
            maxScore: event.maxScore,
          }
        : null;
    case "interaction": {
      const mapped = mapLessonkitTelemetryToLxpack(event);
      return mapped ? { kind: "track", event: mapped } : null;
    }
    default:
      return null;
  }
}
