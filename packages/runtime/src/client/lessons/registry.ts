import type { Lesson } from "@lxpack/validators";
import { renderMarkdown } from "./markdown.js";
import { renderHtmlInteraction } from "./html.js";
import { renderSpaLesson } from "./spa.js";
import { renderComponentLesson } from "./component.js";
import type { BrowserLessonRenderer } from "../types.js";

export interface LessonRenderContext {
  contentEl: HTMLElement;
  baseUrl: string;
}

export type LessonRenderer = (
  lesson: Lesson,
  ctx: LessonRenderContext,
) => Promise<void>;

const defaultLessonRenderers: Record<string, LessonRenderer> = {
  markdown: async (lesson, ctx) => {
    const l = lesson as Extract<Lesson, { type: "markdown" }>;
    if (!l.file) {
      ctx.contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
      return;
    }
    await renderMarkdown(ctx.contentEl, ctx.baseUrl, l.file);
  },
  html: async (lesson, ctx) => {
    const l = lesson as Extract<Lesson, { type: "html" }>;
    if (!l.path) {
      ctx.contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
      return;
    }
    renderHtmlInteraction(ctx.contentEl, ctx.baseUrl, l.path);
  },
  spa: async (lesson, ctx) => {
    const l = lesson as Extract<Lesson, { type: "spa" }>;
    if (!l.path) {
      ctx.contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
      return;
    }
    renderSpaLesson(ctx.contentEl, ctx.baseUrl, l.path);
  },
  component: async (lesson, ctx) => {
    const l = lesson as Extract<Lesson, { type: "component" }>;
    renderComponentLesson(
      ctx.contentEl,
      l.component,
      l.props,
      ctx.baseUrl,
    );
  },
};

export function getLessonRenderer(type: string): LessonRenderer | undefined {
  const plugin = window.__LXPACK_LESSON_RENDERERS__?.[type];
  if (plugin) {
    return plugin as BrowserLessonRenderer as LessonRenderer;
  }
  return defaultLessonRenderers[type];
}
