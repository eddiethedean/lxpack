import type { RuntimeConfig } from "../types.js";
import { NoopReporter } from "./noop.js";
import { XapiReporter } from "./xapi-reporter.js";
import type { AnalyticsReporter } from "./reporter.js";
import type { XapiStatement } from "@lxpack/xapi";

export function createAnalyticsReporter(config: RuntimeConfig): AnalyticsReporter {
  const courseIri =
    config.activityIri ?? config.manifest.tracking?.xapi?.activityIri;

  const useXapi =
    config.mode === "xapi" ||
    config.mode === "cmi5" ||
    (config.mode === "preview" && Boolean(config.xapi?.previewLog && courseIri));

  if (!useXapi || !courseIri) {
    return new NoopReporter();
  }

  const previewLog = config.xapi?.previewLog ?? config.mode === "preview";
  const onStatement = previewLog
    ? (statement: XapiStatement) => {
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[lxpack xAPI]", statement.verb.id, statement.object.id);
        }
        if (typeof localStorage !== "undefined") {
          try {
            const key = "lxpack_xapi_preview_statements";
            const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as XapiStatement[];
            prev.push(statement);
            localStorage.setItem(key, JSON.stringify(prev.slice(-200)));
          } catch {
            void 0;
          }
        }
      }
    : undefined;

  const reporter = new XapiReporter(config.manifest, courseIri, {
    mockLrs: config.xapi?.mockLrs ?? config.mode === "preview",
    onStatement,
  });

  let launched = false;
  return {
    onLaunched: () => {
      if (!launched) {
        launched = true;
        reporter.onLaunched();
      }
    },
    onExperienced: (id) => reporter.onExperienced(id),
    onInteraction: (id, data) => reporter.onInteraction(id, data),
    onAssessmentSubmitted: (id, score, passed) =>
      reporter.onAssessmentSubmitted(id, score, passed),
    onLessonCompleted: (id) => reporter.onLessonCompleted(id),
    onTerminated: () => reporter.onTerminated(),
  };
}
