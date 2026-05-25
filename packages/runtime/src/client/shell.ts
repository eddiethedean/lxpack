import type { CourseManifest } from "@lxpack/validators";
import { escapeHtml } from "./html-utils.js";

export function renderShell(manifest: CourseManifest): HTMLElement {
  const app = document.getElementById("lxpack-app");
  if (!app) throw new Error("#lxpack-app element not found");

  const theme = manifest.runtime?.theme ?? "modern";
  app.className = `lxpack-theme-${theme.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const description = manifest.description
    ? `<p class="lxpack-description">${escapeHtml(manifest.description)}</p>`
    : "";

  app.innerHTML = `
    <div class="lxpack-layout">
      <header class="lxpack-header">
        <h1 class="lxpack-title">${escapeHtml(manifest.title)}</h1>
        <p class="lxpack-version">v${escapeHtml(manifest.version)}</p>
        ${description}
      </header>
      <div class="lxpack-body">
        <nav class="lxpack-nav" aria-label="Course navigation"></nav>
        <main class="lxpack-content" id="lxpack-content"></main>
      </div>
      <footer class="lxpack-footer">
        <div class="lxpack-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div class="lxpack-progress-fill" id="lxpack-progress-fill"></div>
        </div>
        <div class="lxpack-nav-buttons">
          <button type="button" id="lxpack-prev" disabled>Previous</button>
          <button type="button" id="lxpack-next">Next</button>
          <button type="button" id="lxpack-complete" class="lxpack-complete-btn">Mark complete</button>
        </div>
      </footer>
    </div>
  `;

  return app;
}

export function updateProgressBar(ratio: number): void {
  const fill = document.getElementById("lxpack-progress-fill");
  const bar = document.querySelector(".lxpack-progress-bar");
  const pct = Math.round(ratio * 100);
  if (fill) fill.style.width = `${pct}%`;
  if (bar) {
    bar.setAttribute("aria-valuenow", String(pct));
  }
}
