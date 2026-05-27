import type { Lesson } from "@lxpack/validators";
import { renderMarkdown } from "./markdown.js";
import { renderHtmlInteraction } from "./html.js";
import { renderSpaLesson } from "./spa.js";
import { renderComponentLesson } from "./component.js";

export interface LessonRenderContext {
  contentEl: HTMLElement;
  baseUrl: string;
}

export type LessonRenderer = (
  lesson: Lesson,
  ctx: LessonRenderContext,
) => Promise<void>;

export const lessonRenderers: Record<Lesson["type"], LessonRenderer> = {
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
