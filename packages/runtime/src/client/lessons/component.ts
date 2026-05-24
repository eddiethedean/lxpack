import { escapeHtml } from "../html-utils.js";

export function renderComponentLesson(
  contentEl: HTMLElement,
  componentId: string,
  props: Record<string, unknown> | undefined,
  baseUrl: string,
): void {
  const registry = window.__LXPACK_COMPONENTS__;
  if (registry) {
    registry.mount(contentEl, componentId, props ?? {}, baseUrl);
    return;
  }
  contentEl.innerHTML = `
    <article class="lxpack-component lxpack-error">
      <p>Component "${escapeHtml(componentId)}" requires the LXPack components bundle.</p>
    </article>
  `;
}
