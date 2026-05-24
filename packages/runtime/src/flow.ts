import type { Condition, CourseManifest, FlowRule } from "@lxpack/validators";

export interface FlowContext {
  getVariable: (name: string) => unknown;
  isAssessmentPassed: (id: string) => boolean;
  isInteractionDone: (id: string) => boolean;
}

export function evaluateCondition(
  condition: Condition,
  ctx: FlowContext,
): boolean {
  if ("variable" in condition && condition.variable?.eq) {
    const [name, expected] = condition.variable.eq;
    return ctx.getVariable(name) === expected;
  }
  if ("assessment" in condition && condition.assessment?.passed) {
    return ctx.isAssessmentPassed(condition.assessment.passed);
  }
  if ("interaction" in condition && condition.interaction?.done) {
    return ctx.isInteractionDone(condition.interaction.done);
  }
  if ("all" in condition && condition.all) {
    return condition.all.every((c) => evaluateCondition(c, ctx));
  }
  if ("any" in condition && condition.any) {
    return condition.any.some((c) => evaluateCondition(c, ctx));
  }
  return false;
}

export function resolveFlowGoto(
  manifest: CourseManifest,
  ctx: FlowContext,
): string | null {
  const rules = manifest.flow;
  if (!rules?.length) return null;

  for (const rule of rules) {
    if (evaluateCondition(rule.when, ctx)) {
      return rule.goto;
    }
  }
  return null;
}

export function buildActivityOrder(manifest: CourseManifest): string[] {
  const ids: string[] = manifest.lessons.map((l) => l.id);
  for (const ref of manifest.assessments ?? []) {
    ids.push(ref.id);
  }
  return ids;
}

export function resolveLinearAdjacent(
  manifest: CourseManifest,
  currentId: string,
  direction: 1 | -1,
): string | null {
  const order = buildActivityOrder(manifest);
  const idx = order.indexOf(currentId);
  if (idx < 0) return null;
  const next = order[idx + direction];
  return next ?? null;
}

export function resolveNextActivityId(
  manifest: CourseManifest,
  currentId: string,
  ctx: FlowContext,
): string | null {
  const flowTarget = resolveFlowGoto(manifest, ctx);
  if (flowTarget && flowTarget !== currentId) {
    return flowTarget;
  }
  return resolveLinearAdjacent(manifest, currentId, 1);
}

export function resolvePreviousActivityId(
  manifest: CourseManifest,
  currentId: string,
): string | null {
  return resolveLinearAdjacent(manifest, currentId, -1);
}

export type { FlowRule };
