import type { CourseProgress } from "../types.js";

interface CompactProgress {
  c?: string;
  l?: string[];
  a?: Record<string, number>;
  s?: Record<string, unknown>;
}

export function compactProgress(progress: CourseProgress): CompactProgress {
  const compact: CompactProgress = {
    c: progress.currentLessonId,
    l: progress.completedLessons,
    a: progress.assessmentScores,
    s: progress.suspendData,
  };
  if (!compact.l?.length) delete compact.l;
  if (!compact.a || !Object.keys(compact.a).length) delete compact.a;
  if (!compact.s || !Object.keys(compact.s).length) delete compact.s;
  return compact;
}

export function expandProgress(
  compact: CompactProgress,
  defaults: CourseProgress,
): CourseProgress {
  return {
    currentLessonId: compact.c ?? defaults.currentLessonId,
    completedLessons: Array.isArray(compact.l) ? compact.l : defaults.completedLessons,
    assessmentScores:
      compact.a && typeof compact.a === "object"
        ? compact.a
        : defaults.assessmentScores,
    suspendData:
      compact.s && typeof compact.s === "object"
        ? (compact.s as Record<string, unknown>)
        : defaults.suspendData,
  };
}

function isLegacyProgress(data: unknown): data is Partial<CourseProgress> {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    "currentLessonId" in record ||
    "completedLessons" in record ||
    "assessmentScores" in record
  );
}

export function expandLegacyProgress(
  saved: Partial<CourseProgress>,
  defaults: CourseProgress,
): CourseProgress {
  return {
    currentLessonId: saved.currentLessonId ?? defaults.currentLessonId,
    completedLessons: Array.isArray(saved.completedLessons)
      ? saved.completedLessons
      : defaults.completedLessons,
    assessmentScores:
      saved.assessmentScores && typeof saved.assessmentScores === "object"
        ? saved.assessmentScores
        : defaults.assessmentScores,
    suspendData:
      saved.suspendData && typeof saved.suspendData === "object"
        ? (saved.suspendData as Record<string, unknown>)
        : defaults.suspendData,
  };
}

function isEmptyCompactProgress(data: CompactProgress): boolean {
  return (
    data.c === undefined &&
    (!data.l || data.l.length === 0) &&
    (!data.a || Object.keys(data.a).length === 0) &&
    (!data.s || Object.keys(data.s).length === 0)
  );
}

export function parseStoredProgress(
  raw: string,
  defaults: CourseProgress,
): { progress: CourseProgress; parsed: boolean } {
  try {
    const data = JSON.parse(raw) as CompactProgress | Partial<CourseProgress>;
    if (data === null || typeof data !== "object") {
      return { progress: defaults, parsed: false };
    }
    if (isLegacyProgress(data)) {
      return {
        progress: expandLegacyProgress(data, defaults),
        parsed: true,
      };
    }
    const compact = data as CompactProgress;
    if (isEmptyCompactProgress(compact)) {
      return { progress: defaults, parsed: false };
    }
    return { progress: expandProgress(compact, defaults), parsed: true };
  } catch {
    return { progress: defaults, parsed: false };
  }
}
