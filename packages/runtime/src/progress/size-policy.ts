import type { CourseProgress } from "../types.js";
import { SCORM_SUSPEND_DATA_MAX } from "./constants.js";
import { compactProgress, parseStoredProgress } from "./codec.js";

function fitsLimit(progress: CourseProgress, maxBytes: number): boolean {
  return JSON.stringify(compactProgress(progress)).length <= maxBytes;
}

function pruneInteractionKeys(
  progress: CourseProgress,
  maxBytes: number,
  preserveInteractionIds?: Set<string>,
): CourseProgress {
  const suspendData = { ...progress.suspendData };
  const keys = Object.keys(suspendData)
    .filter((k) => k.startsWith("interaction_"))
    .filter((k) => {
      if (!preserveInteractionIds?.size) return true;
      const id = k.slice("interaction_".length);
      return !preserveInteractionIds.has(id);
    })
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

function preserveAssessmentSuspendKeys(
  progress: CourseProgress,
): Record<string, unknown> {
  const suspendData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(progress.suspendData)) {
    if (
      key.startsWith("assessment_attempts_") ||
      key.startsWith("assessment_passing_")
    ) {
      suspendData[key] = value;
    }
  }
  return suspendData;
}

function preserveFlowSuspendKeys(
  progress: CourseProgress,
  preserveInteractionIds?: Set<string>,
): Record<string, unknown> {
  const suspendData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(progress.suspendData)) {
    if (key.startsWith("v:")) {
      suspendData[key] = value;
      continue;
    }
    if (!key.startsWith("interaction_")) continue;
    if (preserveInteractionIds?.size) {
      const id = key.slice("interaction_".length);
      if (!preserveInteractionIds.has(id)) continue;
    }
    suspendData[key] = value;
  }
  return suspendData;
}

function mergeSuspendKeys(
  ...parts: Record<string, unknown>[]
): Record<string, unknown> {
  return Object.assign({}, ...parts);
}

function interactionIdsFromSuspendData(
  suspendData: Record<string, unknown>,
): Set<string> {
  const ids = new Set<string>();
  for (const key of Object.keys(suspendData)) {
    if (key.startsWith("interaction_")) {
      ids.add(key.slice("interaction_".length));
    }
  }
  return ids;
}

function buildMinimalSerializedProgress(
  progress: CourseProgress,
  maxBytes: number,
  preserveInteractionIds?: Set<string>,
): string {
  const flowSuspend = preserveFlowSuspendKeys(progress, preserveInteractionIds);
  let minimal: CourseProgress = {
    currentLessonId: progress.currentLessonId,
    completedLessons: [...progress.completedLessons],
    assessmentScores: { ...progress.assessmentScores },
    suspendData: mergeSuspendKeys(
      preserveAssessmentSuspendKeys(progress),
      flowSuspend,
    ),
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
    suspendData: mergeSuspendKeys(
      preserveAssessmentSuspendKeys(progress),
      flowSuspend,
    ),
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

export interface SerializeProgressOptions {
  preserveInteractionIds?: Set<string>;
}

export function serializeProgressForStorage(
  progress: CourseProgress,
  maxBytes = SCORM_SUSPEND_DATA_MAX,
  options?: SerializeProgressOptions,
): string {
  if (fitsLimit(progress, maxBytes)) {
    return JSON.stringify(compactProgress(progress));
  }

  let candidate = pruneInteractionKeys(
    progress,
    maxBytes,
    options?.preserveInteractionIds,
  );
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
  return buildMinimalSerializedProgress(
    progress,
    maxBytes,
    options?.preserveInteractionIds,
  );
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
    const preserveInteractionIds = interactionIdsFromSuspendData(
      progress.suspendData,
    );
    return serializeProgressForStorage(progress, maxBytes, {
      preserveInteractionIds:
        preserveInteractionIds.size > 0 ? preserveInteractionIds : undefined,
    });
  } catch {
    return JSON.stringify({ c: "" });
  }
}
