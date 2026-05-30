import type { Condition, CourseManifest, FlowRule } from "@lxpack/validators";
import { evaluateCondition } from "./flow-conditions.js";

function inferFlowRuleSource(condition: Condition): string | null {
  if ("interaction" in condition && condition.interaction?.done) {
    return condition.interaction.done;
  }
  if ("assessment" in condition && condition.assessment?.passed) {
    return condition.assessment.passed;
  }
  if ("all" in condition && condition.all?.length) {
    for (const c of condition.all) {
      const inferred = inferFlowRuleSource(c);
      if (inferred !== null) return inferred;
    }
  }
  if ("any" in condition && condition.any?.length) {
    for (const c of condition.any) {
      const inferred = inferFlowRuleSource(c);
      if (inferred !== null) return inferred;
    }
  }
  return null;
}

function ruleAppliesFromActivity(
  rule: FlowRule,
  currentActivityId: string,
): boolean {
  if (rule.from !== undefined) {
    return rule.from === currentActivityId;
  }
  const inferred = inferFlowRuleSource(rule.when);
  if (inferred !== null) {
    return inferred === currentActivityId;
  }
  return true;
}

export interface FlowContext {
  getVariable: (name: string) => unknown;
  getVariableType?: (
    name: string,
  ) => "string" | "number" | "boolean" | undefined;
  isAssessmentPassed: (id: string) => boolean;
  isInteractionDone: (id: string) => boolean;
}

export { evaluateCondition } from "./flow-conditions.js";

export function resolveFlowGoto(
  manifest: CourseManifest,
  ctx: FlowContext,
  currentActivityId: string,
): string | null {
  const rules = manifest.flow;
  if (!rules?.length) return null;

  for (const rule of rules) {
    if (
      ruleAppliesFromActivity(rule, currentActivityId) &&
      evaluateCondition(rule.when, ctx)
    ) {
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
  const flowTarget = resolveFlowGoto(manifest, ctx, currentId);
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
