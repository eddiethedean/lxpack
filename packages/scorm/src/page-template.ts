import { escapeHtml } from "@lxpack/validators";

export interface PageTemplateOptions {
  title: string;
  runtimeCss: string;
  configJson: string;
  runtimeScript: string;
  componentsScript?: string;
}

export function buildLearnerPageHtml(options: PageTemplateOptions): string {
  const componentsTag = options.componentsScript
    ? `<script type="module" src="${escapeHtml(options.componentsScript)}"></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>${options.runtimeCss}</style>
</head>
<body>
  <div id="lxpack-app"></div>
  <script type="application/json" id="lxpack-config">${options.configJson}</script>
  <script>
    window.__LXPACK_CONFIG__ = JSON.parse(document.getElementById('lxpack-config').textContent);
  </script>
  ${componentsTag}
  <script type="module" src="${escapeHtml(options.runtimeScript)}"></script>
</body>
</html>`;
}
