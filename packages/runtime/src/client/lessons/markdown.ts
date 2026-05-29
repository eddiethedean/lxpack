import { marked } from "marked";
import { joinUrl, sanitizeHtml } from "../html-utils.js";

marked.setOptions({ gfm: true, breaks: true });

export async function renderMarkdown(
  contentEl: HTMLElement,
  baseUrl: string,
  file: string,
  isStale?: () => boolean,
): Promise<void> {
  const res = await fetch(joinUrl(baseUrl, file));
  if (isStale?.()) return;
  if (!res.ok) throw new Error(`Failed to load lesson: ${file}`);
  const md = await res.text();
  if (isStale?.()) return;
  const parsed = await marked.parse(md);
  if (isStale?.()) return;
  contentEl.innerHTML = `<article class="lxpack-markdown">${sanitizeHtml(String(parsed))}</article>`;
}
