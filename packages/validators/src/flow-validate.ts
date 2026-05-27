import type { Condition, FlowRule } from "./conditions.js";
import type { CourseManifest } from "./schemas.js";
import type { ValidationIssue } from "./validate.js";

export function collectActivityIds(manifest: CourseManifest): Set<string> {
  const ids = new Set<string>();
  for (const lesson of manifest.lessons) {
    ids.add(lesson.id);
  }
  for (const ref of manifest.assessments ?? []) {
    ids.add(ref.id);
  }
  return ids;
}

export function collectAssessmentIds(manifest: CourseManifest): Set<string> {
  const ids = new Set<string>();
  for (const ref of manifest.assessments ?? []) {
    ids.add(ref.id);
  }
  return ids;
}

export function collectInteractionIds(manifest: CourseManifest): Set<string> {
  const ids = new Set<string>();
  for (const lesson of manifest.lessons) {
    if (lesson.type === "html" || lesson.type === "spa") {
      ids.add(lesson.id);
    }
  }
  return ids;
}

/** Interaction ids referenced by `interaction.done` in flow rules. */
export function collectFlowInteractionDoneIds(
  manifest: CourseManifest,
): Set<string> {
  const ids = new Set<string>();
  if (!manifest.flow?.length) {
    return ids;
  }
  const refs = {
    variables: new Set<string>(),
    assessments: new Set<string>(),
    interactions: new Set<string>(),
  };
  for (const rule of manifest.flow) {
    collectConditionRefs(rule.when, refs);
  }
  return refs.interactions;
}

export function buildActivityOrder(manifest: CourseManifest): string[] {
  const ids: string[] = manifest.lessons.map((l) => l.id);
  for (const ref of manifest.assessments ?? []) {
    ids.push(ref.id);
  }
  return ids;
}

function validateConditionShape(
  condition: Condition,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if ("all" in condition && condition.all) {
    if (condition.all.length === 0) {
      issues.push({
        path,
        message: "Condition all: [] is always true at runtime; use a non-empty list",
        severity: "error",
      });
    }
    for (let i = 0; i < condition.all.length; i++) {
      issues.push(
        ...validateConditionShape(condition.all[i]!, `${path}.all[${i}]`),
      );
    }
  }
  if ("any" in condition && condition.any) {
    if (condition.any.length === 0) {
      issues.push({
        path,
        message: "Condition any: [] is always false at runtime; use a non-empty list",
        severity: "error",
      });
    }
    for (let i = 0; i < condition.any.length; i++) {
      issues.push(
        ...validateConditionShape(condition.any[i]!, `${path}.any[${i}]`),
      );
    }
  }
  return issues;
}

function collectConditionRefs(
  condition: Condition,
  refs: {
    variables: Set<string>;
    assessments: Set<string>;
    interactions: Set<string>;
  },
): void {
  if ("variable" in condition && condition.variable?.eq) {
    refs.variables.add(condition.variable.eq[0]);
  }
  if ("assessment" in condition && condition.assessment?.passed) {
    refs.assessments.add(condition.assessment.passed);
  }
  if ("interaction" in condition && condition.interaction?.done) {
    refs.interactions.add(condition.interaction.done);
  }
  if ("all" in condition && condition.all) {
    for (const c of condition.all) collectConditionRefs(c, refs);
  }
  if ("any" in condition && condition.any) {
    for (const c of condition.any) collectConditionRefs(c, refs);
  }
}

export function validateFlow(
  manifest: CourseManifest,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const flow = manifest.flow;
  if (!flow?.length) return issues;

  const activityIds = collectActivityIds(manifest);
  const assessmentIds = collectAssessmentIds(manifest);
  const interactionIds = collectInteractionIds(manifest);
  const manifestVars = new Set(Object.keys(manifest.variables ?? {}));

  flow.forEach((rule: FlowRule, index: number) => {
    const path = `flow[${index}]`;

    issues.push(...validateConditionShape(rule.when, `${path}.when`));

    if (!activityIds.has(rule.goto)) {
      issues.push({
        path: `${path}.goto`,
        message: `Unknown activity id: ${rule.goto}`,
        severity: "error",
      });
    }

    const refs = {
      variables: new Set<string>(),
      assessments: new Set<string>(),
      interactions: new Set<string>(),
    };
    collectConditionRefs(rule.when, refs);

    for (const v of refs.variables) {
      if (!manifestVars.has(v)) {
        issues.push({
          path: `${path}.when`,
          message: `Unknown variable in condition: ${v}`,
          severity: "error",
        });
      }
    }
    for (const a of refs.assessments) {
      if (!assessmentIds.has(a)) {
        issues.push({
          path: `${path}.when`,
          message: `Unknown assessment in condition: ${a}`,
          severity: "error",
        });
      }
    }
    for (const i of refs.interactions) {
      if (!interactionIds.has(i)) {
        issues.push({
          path: `${path}.when`,
          message: `Unknown interaction id in condition (expected html or spa lesson): ${i}`,
          severity: "error",
        });
      }
    }
  });

  return issues;
}

function conditionCouldApplyAt(
  condition: Condition,
  currentActivityId: string,
  interactionIds: Set<string>,
): boolean {
  if ("variable" in condition) return true;
  if ("assessment" in condition && condition.assessment?.passed) {
    return currentActivityId === condition.assessment.passed;
  }
  if ("interaction" in condition && condition.interaction?.done) {
    return interactionIds.has(currentActivityId);
  }
  if ("all" in condition && condition.all) {
    return (
      condition.all.length > 0 &&
      condition.all.every((c) =>
        conditionCouldApplyAt(c, currentActivityId, interactionIds),
      )
    );
  }
  if ("any" in condition && condition.any) {
    return (
      condition.any.length > 0 &&
      condition.any.some((c) =>
        conditionCouldApplyAt(c, currentActivityId, interactionIds),
      )
    );
  }
  return false;
}

/**
 * Detect cycles reachable via flow jumps (first matching applicable rule).
 */
export function detectFlowCycles(manifest: CourseManifest): string[] {
  const flow = manifest.flow;
  if (!flow?.length) return [];

  const activityIds = collectActivityIds(manifest);
  const interactionIds = collectInteractionIds(manifest);

  const flowJumpFrom = (current: string): string | null => {
    for (const rule of flow) {
      if (
        rule.goto !== current &&
        activityIds.has(rule.goto) &&
        conditionCouldApplyAt(rule.when, current, interactionIds)
      ) {
        return rule.goto;
      }
    }
    return null;
  };

  const errors: string[] = [];
  const reported = new Set<string>();

  const dfs = (node: string, stack: string[], onStack: Set<string>): void => {
    const jump = flowJumpFrom(node);
    if (!jump) return;

    if (onStack.has(jump)) {
      const cycleStart = stack.indexOf(jump);
      const cycle = [...stack.slice(cycleStart), jump];
      const key = cycle.join("->");
      if (!reported.has(key)) {
        reported.add(key);
        errors.push(`Flow cycle: ${cycle.join(" -> ")}`);
      }
      return;
    }
    if (stack.length >= activityIds.size) return;

    onStack.add(jump);
    stack.push(jump);
    dfs(jump, stack, onStack);
    stack.pop();
    onStack.delete(jump);
  };

  for (const id of activityIds) {
    dfs(id, [id], new Set([id]));
  }

  return errors;
}
