import type { CourseManifest } from "@lxpack/validators";

export interface BuildHtmlOptions {
  manifest: CourseManifest;
  runtimeCss: string;
  mode: "standalone" | "scorm12";
}

export function buildIndexHtml(options: BuildHtmlOptions): string {
  const { manifest, runtimeCss, mode } = options;
  const config = JSON.stringify({
    manifest,
    baseUrl: ".",
    mode,
  });

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
