import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { safeJsonForHtml } from "./safe-json.js";
import { buildLearnerPageHtml } from "./page-template.js";

export interface BuildHtmlOptions {
  manifest: CourseManifest;
  runtimeCss: string;
  mode: "standalone" | "scorm12" | "scorm2004" | "xapi" | "cmi5";
  activityIri?: string;
  activityId?: string;
  assessmentBundle?: RuntimeAssessmentBundle;
  componentsScript?: string;
}

export function buildRuntimeConfig(options: BuildHtmlOptions): Record<string, unknown> {
  const { manifest, mode, assessmentBundle, activityId, activityIri } = options;
  return {
    manifest,
    baseUrl: activityId ? "../.." : ".",
    mode,
    ...(activityIri ? { activityIri } : {}),
    ...(activityId ? { activityId } : {}),
    ...(assessmentBundle
      ? {
          ...(Object.keys(assessmentBundle.assessments).length
            ? { assessments: assessmentBundle.assessments }
            : {}),
          ...(Object.keys(assessmentBundle.answerKeys).length
            ? { answerKeys: assessmentBundle.answerKeys }
            : {}),
          ...(Object.keys(assessmentBundle.configs ?? {}).length
            ? { assessmentConfigs: assessmentBundle.configs }
            : {}),
          ...(Object.keys(assessmentBundle.feedback ?? {}).length
            ? { assessmentFeedback: assessmentBundle.feedback }
            : {}),
        }
      : {}),
  };
}

export function buildScoIndexHtml(
  options: BuildHtmlOptions & { activityId: string },
): string {
  const { manifest, runtimeCss, activityId, componentsScript } = options;
  const config = safeJsonForHtml(buildRuntimeConfig({ ...options, activityId }));

  return buildLearnerPageHtml({
    title: `${manifest.title} — ${activityId}`,
    runtimeCss,
    configJson: config,
    runtimeScript: "../../lxpack-runtime.js",
    componentsScript,
  });
}

export function buildIndexHtml(options: BuildHtmlOptions): string {
  const { manifest, runtimeCss, componentsScript } = options;
  const config = safeJsonForHtml(buildRuntimeConfig(options));

  return buildLearnerPageHtml({
    title: manifest.title,
    runtimeCss,
    configJson: config,
    runtimeScript: "./lxpack-runtime.js",
    componentsScript,
  });
}
