import {
  buildAnswered,
  buildCompleted,
  buildExperienced,
  buildInteracted,
  buildLaunched,
  buildPassedFailed,
  bootstrapCmi5LaunchParams,
  defaultPreviewActor,
  parseLaunchParamsFromWindow,
  StatementQueue,
  type LaunchParams,
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
  /** Inject launch params (tests); defaults to window query string. */
  launchParams?: LaunchParams;
}

export class XapiReporter implements AnalyticsReporter {
  private session: XapiSessionContext | null = null;
  private queue: StatementQueue | null = null;
  private readonly bootstrapPromise: Promise<void>;
  private readonly options?: XapiReporterOptions;
  private readonly activities: Map<string, CourseActivity>;
  private lastExperienced?: string;
  private launched = false;

  constructor(
    manifest: CourseManifest,
    courseIri: string,
    options?: XapiReporterOptions,
  ) {
    this.options = options;
    this.activities = new Map(
      enumerateActivities(manifest).map((a) => [a.id, a]),
    );

    const launch =
      options?.launchParams ??
      ((globalThis as { location?: unknown }).location != null
        ? parseLaunchParamsFromWindow()
        : {});

    this.bootstrapPromise = this.bootstrapSession(
      manifest,
      courseIri,
      launch,
      options,
    );
  }

  private async bootstrapSession(
    manifest: CourseManifest,
    courseIri: string,
    launch: LaunchParams,
    options?: XapiReporterOptions,
  ): Promise<void> {
    try {
      const merged = await bootstrapCmi5LaunchParams(launch);
      const actor = merged.actor ?? defaultPreviewActor();

      if (merged.fetch && !merged.endpoint) {
        console.error(
          "[lxpack cmi5] Launch endpoint query parameter is required when using fetch",
        );
        return;
      }

      this.session = {
        actor,
        registration: merged.registration,
        courseIri,
        courseTitle: manifest.tracking?.xapi?.displayName ?? manifest.title,
      };

      this.queue = new StatementQueue({
        mock: options?.mockLrs ?? !merged.endpoint,
        credentials: merged.endpoint
          ? { endpoint: merged.endpoint, auth: merged.auth }
          : undefined,
        onError: (err) => {
          console.warn("[lxpack xAPI] LRS error:", err);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[lxpack cmi5] Session bootstrap failed: ${message}`);
    }
  }

  private async ensureReady(): Promise<boolean> {
    await this.bootstrapPromise;
    return this.session !== null && this.queue !== null;
  }

  private emit(statement: XapiStatement): void {
    this.options?.onStatement?.(statement);
    void this.ensureReady().then((ready) => {
      if (!ready || !this.queue) return;
      this.queue.enqueue(statement);
    });
  }

  onLaunched(): void {
    if (this.launched) return;
    void this.ensureReady().then((ready) => {
      if (!ready || !this.session) return;
      this.launched = true;
      this.emit(buildLaunched(this.session));
    });
  }

  onExperienced(activityId: string): void {
    if (this.lastExperienced === activityId) return;
    this.lastExperienced = activityId;
    const activity = this.activities.get(activityId);
    if (!activity) return;
    void this.ensureReady().then((ready) => {
      if (!ready || !this.session) return;
      this.emit(buildExperienced(this.session, activity));
    });
  }

  onInteraction(id: string, data?: Record<string, unknown>): void {
    void this.ensureReady().then((ready) => {
      if (!ready || !this.session) return;
      const isSimulation =
        data?.simulation != null ||
        (typeof data?.type === "string" && data.type === "simulation");
      if (
        isSimulation &&
        data?.simulation &&
        typeof data.simulation === "object"
      ) {
        this.emit(
          buildInteracted(this.session, id, {
            simulation: data.simulation as Record<string, unknown>,
          }),
        );
        return;
      }
      this.emit(buildInteracted(this.session, id, data));
    });
  }

  onAssessmentSubmitted(id: string, score: number, passed: boolean): void {
    void this.ensureReady().then((ready) => {
      if (!ready || !this.session) return;
      const activity = this.activities.get(id);
      if (!activity) return;
      this.emit(buildAnswered(this.session, activity, score, passed));
      this.emit(buildPassedFailed(this.session, activity, passed));
    });
  }

  onLessonCompleted(id: string): void {
    void this.ensureReady().then((ready) => {
      if (!ready || !this.session) return;
      const activity = this.activities.get(id);
      if (!activity) return;
      this.emit(buildCompleted(this.session, activity));
    });
  }

  onTerminated(): void {
    void this.ensureReady().then((ready) => {
      if (!ready || !this.queue) return;
      this.queue.flushTerminal();
    });
  }
}
