import type { CourseManifest } from "@lxpack/validators";
import { collectFlowInteractionDoneIds } from "@lxpack/validators";

/** Interaction ids referenced by flow `interaction.done` conditions. */
export function getFlowProtectedInteractionIds(
  manifest: CourseManifest,
): Set<string> {
  return collectFlowInteractionDoneIds(manifest);
}
