import {
  buildAnswered,
  buildCompleted,
  buildExperienced,
  buildInteracted,
  buildLaunched,
  buildPassedFailed,
  defaultPreviewActor,
  parseLaunchParamsFromWindow,
  StatementQueue,
  type XapiSessionContext,
  type XapiStatement,
} from "@lxpack/xapi";
import {
  enumerateActivities,
  type CourseActivity,
  type CourseManifest,
} from "@lxpack/validators";
import type { AnalyticsReporter } from "./reporter.js";

export interface XapiReporterOptions {
  mockLrs?: boolean;
  onStatement?: (statement: XapiStatement) => void;
}

export class XapiReporter implements AnalyticsReporter {
  private readonly session: XapiSessionContext;
  private readonly activities: Map<string, CourseActivity>;
  private readonly queue: StatementQueue;
  private readonly options?: XapiReporterOptions;
  private lastExperienced?: string;

  constructor(
    manifest: CourseManifest,
    courseIri: string,
    options?: XapiReporterOptions,
  ) {
    this.options = options;
    const launch =
      (globalThis as { location?: unknown }).location != null
        ? parseLaunchParamsFromWindow()
        : {};
    const actor = launch.actor ?? defaultPreviewActor();

    if (launch.fetch) {
      console.warn(
        "[lxpack cmi5] Launch fetch URL is present but cmi5 session bootstrap via fetch is not implemented in v0.3.0",
      );
    }

    this.session = {
      actor,
      registration: launch.registration,
      courseIri,
      courseTitle: manifest.tracking?.xapi?.displayName ?? manifest.title,
    };

    this.activities = new Map(
      enumerateActivities(manifest).map((a) => [a.id, a]),
    );

    this.queue = new StatementQueue({
      mock: options?.mockLrs ?? !launch.endpoint,
      credentials: launch.endpoint
        ? { endpoint: launch.endpoint, auth: launch.auth }
        : undefined,
      onError: (err) => {
        console.warn("[lxpack xAPI] LRS error:", err);
      },
    });
  }

  private emit(statement: XapiStatement): void {
    this.options?.onStatement?.(statement);
    this.queue.enqueue(statement);
  }

  onLaunched(): void {
    this.emit(buildLaunched(this.session));
  }

  onExperienced(activityId: string): void {
    if (this.lastExperienced === activityId) return;
    this.lastExperienced = activityId;
    const activity = this.activities.get(activityId);
    if (!activity) return;
    this.emit(buildExperienced(this.session, activity));
  }

  onInteraction(id: string, data?: Record<string, unknown>): void {
    const isSimulation =
      data?.simulation != null ||
      (typeof data?.type === "string" && data.type === "simulation");
    if (isSimulation && data?.simulation && typeof data.simulation === "object") {
      this.emit(
        buildInteracted(this.session, id, {
          simulation: data.simulation as Record<string, unknown>,
        }),
      );
      return;
    }
    this.emit(buildInteracted(this.session, id, data));
  }

  onAssessmentSubmitted(id: string, score: number, passed: boolean): void {
    const activity = this.activities.get(id);
    if (!activity) return;
    this.emit(buildAnswered(this.session, activity, score, passed));
    this.emit(buildPassedFailed(this.session, activity, passed));
  }

  onLessonCompleted(id: string): void {
    const activity = this.activities.get(id);
    if (!activity) return;
    this.emit(buildCompleted(this.session, activity));
  }

  onTerminated(): void {
    void this.queue.flush();
  }
}
