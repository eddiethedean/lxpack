import type { CourseProgress } from "../types.js";
import { SCORM_SUSPEND_DATA_MAX } from "./constants.js";
import { compactProgress, parseStoredProgress } from "./codec.js";

function fitsLimit(progress: CourseProgress, maxBytes: number): boolean {
  return JSON.stringify(compactProgress(progress)).length <= maxBytes;
}

function pruneInteractionKeys(progress: CourseProgress, maxBytes: number): CourseProgress {
  const suspendData = { ...progress.suspendData };
  const keys = Object.keys(suspendData)
    .filter((k) => k.startsWith("interaction_"))
    .sort();

  for (const key of keys) {
    delete suspendData[key];
    const trial = { ...progress, suspendData };
    if (fitsLimit(trial, maxBytes)) {
      return trial;
    }
  }

  return { ...progress, suspendData };
}

function isEssentialSuspendKey(key: string): boolean {
  return (
    key.startsWith("interaction_") ||
    key.startsWith("v:") ||
    key.startsWith("assessment_attempts_") ||
    key.startsWith("assessment_passing_")
  );
}

function pruneNonEssentialSuspendKeys(
  progress: CourseProgress,
  maxBytes: number,
): CourseProgress {
  const suspendData = { ...progress.suspendData };
  const keys = Object.keys(suspendData)
    .filter((k) => !isEssentialSuspendKey(k))
    .sort();

  for (const key of keys) {
    delete suspendData[key];
    const trial = { ...progress, suspendData };
    if (fitsLimit(trial, maxBytes)) {
      return trial;
    }
  }

  const variableKeys = Object.keys(suspendData)
    .filter((k) => k.startsWith("v:"))
    .sort();
  for (const key of variableKeys) {
    delete suspendData[key];
    const trial = { ...progress, suspendData };
    if (fitsLimit(trial, maxBytes)) {
      return trial;
    }
  }

  return { ...progress, suspendData };
}

function buildMinimalSerializedProgress(
  progress: CourseProgress,
  maxBytes: number,
): string {
  let minimal: CourseProgress = {
    currentLessonId: progress.currentLessonId,
    completedLessons: [...progress.completedLessons],
    assessmentScores: { ...progress.assessmentScores },
    suspendData: {},
  };

  if (fitsLimit(minimal, maxBytes)) {
    return JSON.stringify(compactProgress(minimal));
  }

  while (minimal.completedLessons.length > 0) {
    minimal.completedLessons.pop();
    if (fitsLimit(minimal, maxBytes)) {
      return JSON.stringify(compactProgress(minimal));
    }
  }

  const scoreIds = Object.keys(minimal.assessmentScores);
  while (scoreIds.length > 0) {
    delete minimal.assessmentScores[scoreIds.pop()!];
    if (fitsLimit(minimal, maxBytes)) {
      return JSON.stringify(compactProgress(minimal));
    }
  }

  minimal = {
    currentLessonId: progress.currentLessonId,
    completedLessons: [],
    assessmentScores: {},
    suspendData: {},
  };
  const serialized = JSON.stringify(compactProgress(minimal));
  if (serialized.length <= maxBytes) {
    return serialized;
  }

  const lessonOnly = JSON.stringify({
    c: progress.currentLessonId.slice(0, Math.max(0, maxBytes - 20)),
  });
  return lessonOnly.length <= maxBytes
    ? lessonOnly
    : JSON.stringify({ c: "" });
}

export function serializeProgressForStorage(
  progress: CourseProgress,
  maxBytes = SCORM_SUSPEND_DATA_MAX,
): string {
  if (fitsLimit(progress, maxBytes)) {
    return JSON.stringify(compactProgress(progress));
  }

  let candidate = pruneInteractionKeys(progress, maxBytes);
  if (fitsLimit(candidate, maxBytes)) {
    return JSON.stringify(compactProgress(candidate));
  }

  candidate = pruneNonEssentialSuspendKeys(candidate, maxBytes);
  if (fitsLimit(candidate, maxBytes)) {
    return JSON.stringify(compactProgress(candidate));
  }

  console.warn(
    `[lxpack] suspend_data exceeds ${maxBytes} chars; using minimal progress snapshot`,
  );
  return buildMinimalSerializedProgress(progress, maxBytes);
}

export function trimSuspendData(
  data: string,
  maxBytes = SCORM_SUSPEND_DATA_MAX,
): string {
  if (data.length <= maxBytes) return data;

  console.warn(
    `[lxpack] suspend_data exceeds ${maxBytes} chars; using minimal progress snapshot`,
  );

  try {
    const defaults: CourseProgress = {
      currentLessonId: "",
      completedLessons: [],
      assessmentScores: {},
      suspendData: {},
    };
    const { progress } = parseStoredProgress(data, defaults);
    return serializeProgressForStorage(progress, maxBytes);
  } catch {
    return JSON.stringify({ c: "" });
  }
}
