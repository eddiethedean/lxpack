import type { CourseManifest } from "@lxpack/validators";
import type { RuntimeAssessmentBundle } from "@lxpack/validators";
import { safeJsonForHtml } from "./safe-json.js";

export interface BuildHtmlOptions {
  manifest: CourseManifest;
  runtimeCss: string;
  mode: "standalone" | "scorm12" | "scorm2004";
  activityId?: string;
  assessmentBundle?: RuntimeAssessmentBundle;
  componentsScript?: string;
}

export function buildRuntimeConfig(options: BuildHtmlOptions): Record<string, unknown> {
  const { manifest, mode, assessmentBundle, activityId } = options;
  return {
    manifest,
    baseUrl: activityId ? "../.." : ".",
    mode,
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

  const componentsTag = componentsScript
    ? `<script type="module" src="${escapeHtml(componentsScript)}"></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(manifest.title)} — ${escapeHtml(activityId)}</title>
  <style>${runtimeCss}</style>
</head>
<body>
  <div id="lxpack-app"></div>
  <script type="application/json" id="lxpack-config">${config}</script>
  <script>
    window.__LXPACK_CONFIG__ = JSON.parse(document.getElementById('lxpack-config').textContent);
  </script>
  ${componentsTag}
  <script type="module" src="../../lxpack-runtime.js"></script>
</body>
</html>`;
}

export function buildIndexHtml(options: BuildHtmlOptions): string {
  const { manifest, runtimeCss, componentsScript } = options;
  const config = safeJsonForHtml(buildRuntimeConfig(options));
  const componentsTag = componentsScript
    ? `<script type="module" src="${escapeHtml(componentsScript)}"></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(manifest.title)}</title>
  <style>${runtimeCss}</style>
</head>
<body>
  <div id="lxpack-app"></div>
  <script type="application/json" id="lxpack-config">${config}</script>
  <script>
    window.__LXPACK_CONFIG__ = JSON.parse(document.getElementById('lxpack-config').textContent);
  </script>
  ${componentsTag}
  <script type="module" src="./lxpack-runtime.js"></script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
