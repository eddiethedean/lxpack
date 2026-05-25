import type { CourseActivity } from "./manifest-activities.js";
import {
  buildActivityObject,
  buildCourseActivityObject,
  courseActivityIri,
} from "./activity.js";
import type { XapiActor, XapiContext, XapiStatement } from "./statement.js";
import {
  VERB_ANSWERED,
  VERB_COMPLETED,
  VERB_EXPERIENCED,
  VERB_FAILED,
  VERB_INTERACTED,
  VERB_LAUNCHED,
  VERB_PASSED,
} from "./verbs.js";
import { newStatementId } from "./uuid.js";

export interface XapiSessionContext {
  actor: XapiActor;
  registration?: string;
  courseIri: string;
  courseTitle: string;
}

function baseStatement(
  ctx: XapiSessionContext,
  verb: XapiStatement["verb"],
  object: XapiStatement["object"],
  extras?: Pick<XapiStatement, "result" | "context">,
): XapiStatement {
  const context: XapiContext = {
    registration: ctx.registration,
    contextActivities: {
      parent: [buildCourseActivityObject(ctx.courseIri, ctx.courseTitle)],
    },
    ...extras?.context,
  };
  return {
    id: newStatementId(),
    actor: ctx.actor,
    verb,
    object,
    timestamp: new Date().toISOString(),
    ...extras,
    context,
  };
}

export function buildLaunched(ctx: XapiSessionContext): XapiStatement {
  return baseStatement(
    ctx,
    VERB_LAUNCHED,
    buildCourseActivityObject(ctx.courseIri, ctx.courseTitle),
  );
}

export function buildExperienced(
  ctx: XapiSessionContext,
  activity: CourseActivity,
): XapiStatement {
  return baseStatement(ctx, VERB_EXPERIENCED, buildActivityObject(ctx.courseIri, activity));
}

export function buildCompleted(
  ctx: XapiSessionContext,
  activity: CourseActivity,
): XapiStatement {
  return baseStatement(ctx, VERB_COMPLETED, buildActivityObject(ctx.courseIri, activity), {
    result: { completion: true },
  });
}

export function buildAnswered(
  ctx: XapiSessionContext,
  activity: CourseActivity,
  score: number,
  passed: boolean,
): XapiStatement {
  return baseStatement(ctx, VERB_ANSWERED, buildActivityObject(ctx.courseIri, activity), {
    result: {
      score: { scaled: Math.max(0, Math.min(1, score)) },
      success: passed,
      completion: true,
    },
  });
}

export function buildPassedFailed(
  ctx: XapiSessionContext,
  activity: CourseActivity,
  passed: boolean,
): XapiStatement {
  return baseStatement(
    ctx,
    passed ? VERB_PASSED : VERB_FAILED,
    buildActivityObject(ctx.courseIri, activity),
    { result: { success: passed, completion: true } },
  );
}

export function buildInteracted(
  ctx: XapiSessionContext,
  interactionId: string,
  data?: Record<string, unknown>,
): XapiStatement {
  const activity: CourseActivity = {
    id: interactionId,
    title: interactionId,
    kind: "lesson",
  };
  const extensions: Record<string, unknown> = { ...(data ?? {}) };
  if (data?.simulation != null) {
    extensions["https://lxpack.dev/xapi/extensions/simulation"] = data.simulation;
  }
  return baseStatement(ctx, VERB_INTERACTED, buildActivityObject(ctx.courseIri, activity), {
    result: Object.keys(extensions).length ? { extensions } : undefined,
  });
}

export function buildSimulationInteracted(
  ctx: XapiSessionContext,
  simulationId: string,
  payload: Record<string, unknown>,
): XapiStatement {
  return buildInteracted(ctx, simulationId, { simulation: payload });
}

export { courseActivityIri };
