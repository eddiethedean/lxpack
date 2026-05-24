import { registerComponent } from "./registry.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function registerBuiltinComponents(): void {
  registerComponent("callout", (el, props) => {
    const variant = String(props.variant ?? "info");
    const body = String(props.body ?? "");
    el.innerHTML = `
      <aside class="lxpack-callout lxpack-callout-${escapeHtml(variant)}" role="note">
        <p>${escapeHtml(body)}</p>
      </aside>
    `;
  });

  registerComponent("image-card", (el, props, baseUrl) => {
    const title = String(props.title ?? "");
    const src = String(props.src ?? "");
    const caption = String(props.caption ?? "");
    const url = src.startsWith("http") ? src : `${baseUrl.replace(/\/$/, "")}/${src}`;
    el.innerHTML = `
      <figure class="lxpack-image-card">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" />
        ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
      </figure>
    `;
  });

  registerComponent("checklist", (el, props) => {
    const items = Array.isArray(props.items) ? props.items : [];
    const html = items
      .map((item) => `<li>${escapeHtml(String(item))}</li>`)
      .join("");
    el.innerHTML = `<ul class="lxpack-checklist">${html}</ul>`;
  });
}

registerBuiltinComponents();
