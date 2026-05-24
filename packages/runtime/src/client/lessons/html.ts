import { joinUrl } from "../html-utils.js";

export function renderHtmlInteraction(
  contentEl: HTMLElement,
  baseUrl: string,
  path: string,
): void {
  contentEl.innerHTML = `
    <iframe
      class="lxpack-interaction-frame"
      src="${joinUrl(baseUrl, `${path}/index.html`)}"
      title="Interaction"
      sandbox="allow-scripts allow-same-origin allow-forms"
    ></iframe>
  `;
}
