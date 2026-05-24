import type { CourseProgress } from "../types.js";
import { SCORM_SUSPEND_DATA_MAX } from "./constants.js";
import { compactProgress } from "./codec.js";

function pruneInteractionKeys(progress: CourseProgress): CourseProgress {
  const suspendData = { ...progress.suspendData };
  const keys = Object.keys(suspendData)
    .filter((k) => k.startsWith("interaction_"))
    .sort();

  for (const key of keys) {
    delete suspendData[key];
    const trial = JSON.stringify(compactProgress({ ...progress, suspendData }));
    if (trial.length <= SCORM_SUSPEND_DATA_MAX) {
      return { ...progress, suspendData };
    }
  }

  return { ...progress, suspendData };
}

export function serializeProgressForStorage(
  progress: CourseProgress,
  maxBytes = SCORM_SUSPEND_DATA_MAX,
): string {
  let serialized = JSON.stringify(compactProgress(progress));

  if (serialized.length <= maxBytes) {
    return serialized;
  }

  const pruned = pruneInteractionKeys(progress);
  serialized = JSON.stringify(compactProgress(pruned));

  if (serialized.length <= maxBytes) {
    return serialized;
  }

  console.warn(
    `[lxpack] suspend_data exceeds ${maxBytes} chars; truncating`,
  );
  return serialized.slice(0, maxBytes);
}

export function trimSuspendData(
  data: string,
  maxBytes = SCORM_SUSPEND_DATA_MAX,
): string {
  if (data.length <= maxBytes) return data;
  console.warn(
    `[lxpack] suspend_data exceeds ${maxBytes} chars; truncating`,
  );
  return data.slice(0, maxBytes);
}
