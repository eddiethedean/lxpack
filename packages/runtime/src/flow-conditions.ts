import type { Condition } from "@lxpack/validators";
import type { FlowContext } from "./flow.js";

type ConditionHandler = (condition: Condition, ctx: FlowContext) => boolean | null;

const conditionHandlers: ConditionHandler[] = [
  (condition, ctx) => {
    if ("variable" in condition && condition.variable?.eq) {
      const [name, expected] = condition.variable.eq;
      return ctx.getVariable(name) === expected;
    }
    return null;
  },
  (condition, ctx) => {
    if ("assessment" in condition && condition.assessment?.passed) {
      return ctx.isAssessmentPassed(condition.assessment.passed);
    }
    return null;
  },
  (condition, ctx) => {
    if ("interaction" in condition && condition.interaction?.done) {
      return ctx.isInteractionDone(condition.interaction.done);
    }
    return null;
  },
  (condition, ctx) => {
    if ("all" in condition && condition.all) {
      return condition.all.every((c) => evaluateCondition(c, ctx));
    }
    return null;
  },
  (condition, ctx) => {
    if ("any" in condition && condition.any) {
      return condition.any.some((c) => evaluateCondition(c, ctx));
    }
    return null;
  },
];

export function evaluateCondition(
  condition: Condition,
  ctx: FlowContext,
): boolean {
  for (const handler of conditionHandlers) {
    const result = handler(condition, ctx);
    if (result !== null) {
      return result;
    }
  }
  return false;
}
