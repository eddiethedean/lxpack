import { escapeHtml, joinUrl } from "../html-utils.js";

export function renderSpaLesson(
  contentEl: HTMLElement,
  baseUrl: string,
  path: string,
): void {
  const src = escapeHtml(joinUrl(baseUrl, `${path}/index.html`));
  contentEl.innerHTML = `
    <iframe
      class="lxpack-interaction-frame"
      src="${src}"
      title="Lesson"
      sandbox="allow-scripts allow-same-origin allow-forms"
    ></iframe>
  `;
}

