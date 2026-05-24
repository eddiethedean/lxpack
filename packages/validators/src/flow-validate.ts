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
  const manifestVars = new Set(Object.keys(manifest.variables ?? {}));

  flow.forEach((rule: FlowRule, index: number) => {
    const path = `flow[${index}]`;

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
      if (!activityIds.has(a)) {
        issues.push({
          path: `${path}.when`,
          message: `Unknown assessment in condition: ${a}`,
          severity: "error",
        });
      }
    }
    for (const i of refs.interactions) {
      if (!activityIds.has(i)) {
        issues.push({
          path: `${path}.when`,
          message: `Unknown interaction/lesson id in condition: ${i}`,
          severity: "warning",
        });
      }
    }
  });

  return issues;
}

/** Detect simple goto cycles (same-target chains). */
export function detectFlowCycles(flow: FlowRule[]): string[] {
  const gotoOf = new Map<number, string>();
  flow.forEach((rule, i) => gotoOf.set(i, rule.goto));

  const errors: string[] = [];
  const visited = new Set<number>();

  for (let start = 0; start < flow.length; start++) {
    if (visited.has(start)) continue;
    const chain = new Set<number>();
    let i: number | undefined = start;
    while (i !== undefined && i < flow.length) {
      const ruleIndex = i;
      if (chain.has(ruleIndex)) {
        errors.push(`Flow rule cycle detected involving flow[${ruleIndex}]`);
        break;
      }
      if (visited.has(ruleIndex)) break;
      chain.add(ruleIndex);
      visited.add(ruleIndex);
      const target = gotoOf.get(ruleIndex);
      const nextIdx = flow.findIndex(
        (_, idx) => idx > ruleIndex && flow[idx]!.goto === target,
      );
      i = nextIdx >= 0 ? nextIdx : undefined;
    }
  }
  return errors;
}
