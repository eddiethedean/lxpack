import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import type { CourseManifest, LearnerAssessment, Lesson } from "@lxpack/validators";
import {
  buildActivityOrder,
  resolveNextActivityId,
  resolvePreviousActivityId,
} from "./flow.js";
import { renderAssessment } from "./quiz/index.js";
import type { RuntimeAssessmentPayload } from "./quiz/types.js";
import { LxpackRuntime } from "./runtime.js";
import type { RuntimeConfig } from "./types.js";

marked.setOptions({ gfm: true, breaks: true });

declare global {
  interface Window {
    lxpack?: ReturnType<LxpackRuntime["getAPI"]>;
    __LXPACK_CONFIG__?: RuntimeConfig;
    __LXPACK_COMPONENTS__?: {
      mount: (
        el: HTMLElement,
        componentId: string,
        props: Record<string, unknown>,
        baseUrl: string,
      ) => void;
    };
  }
}

export type NavItem =
  | { kind: "lesson"; id: string; title: string; lesson: Lesson }
  | { kind: "assessment"; id: string; title: string; file: string };

export function buildNavItems(manifest: CourseManifest): NavItem[] {
  const items: NavItem[] = manifest.lessons.map((lesson) => ({
    kind: "lesson",
    id: lesson.id,
    title: lesson.title ?? lesson.id,
    lesson,
  }));

  for (const ref of manifest.assessments ?? []) {
    items.push({
      kind: "assessment",
      id: ref.id,
      title: ref.id.replace(/_/g, " "),
      file: ref.file,
    });
  }

  return items;
}

function getConfig(): RuntimeConfig {
  const config = window.__LXPACK_CONFIG__;
  if (!config) {
    throw new Error("LXPack runtime config not found");
  }
  return config;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/${path}`;
}

function renderShell(manifest: CourseManifest): HTMLElement {
  const app = document.getElementById("lxpack-app");
  if (!app) throw new Error("#lxpack-app element not found");

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

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export async function renderMarkdown(
  contentEl: HTMLElement,
  baseUrl: string,
  file: string,
): Promise<void> {
  const res = await fetch(joinUrl(baseUrl, file));
  if (!res.ok) throw new Error(`Failed to load lesson: ${file}`);
  const md = await res.text();
  const parsed = await marked.parse(md);
  contentEl.innerHTML = `<article class="lxpack-markdown">${sanitizeHtml(String(parsed))}</article>`;
}

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

export async function loadAssessment(
  config: RuntimeConfig,
  baseUrl: string,
  assessmentId: string,
  file: string,
): Promise<{
  assessment: LearnerAssessment;
  answerKey: Record<string, string>;
  payload?: RuntimeAssessmentPayload;
}> {
  const embedded = config.assessments?.[assessmentId];
  if (embedded) {
    const answerKey = config.answerKeys?.[assessmentId] ?? {};
    const assessmentConfig = config.assessmentConfigs?.[assessmentId] ?? {
      maxAttempts: 1,
      shuffleChoices: false,
      showFeedback: "never" as const,
    };
    return {
      assessment: embedded,
      answerKey,
      payload: {
        ...embedded,
        config: assessmentConfig,
        feedback: config.assessmentFeedback?.[assessmentId],
      },
    };
  }

  const res = await fetch(joinUrl(baseUrl, file));
  if (!res.ok) throw new Error(`Failed to load assessment: ${file}`);
  const text = await res.text();
  const raw = parseYaml(text) as LearnerAssessment & {
    questions: Array<{
      id: string;
      prompt: string;
      choices: Array<{ id: string; text: string; correct?: boolean }>;
    }>;
  };

  const answerKey: Record<string, string> = {};
  for (const q of raw.questions ?? []) {
    const correct = q.choices?.find(
      (c) => "correct" in c && c.correct === true,
    );
    if (correct) {
      answerKey[q.id] = correct.id;
    }
  }

  const assessment: LearnerAssessment = {
    id: raw.id ?? assessmentId,
    title: raw.title,
    passingScore: raw.passingScore ?? 0.7,
    questions: (raw.questions ?? []).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    })),
  };

  return { assessment, answerKey };
}

export function renderNav(
  navEl: HTMLElement,
  items: NavItem[],
  currentId: string,
  completedLessons: string[],
  passedAssessments: Set<string>,
  onSelect: (id: string) => void,
): void {
  navEl.innerHTML = items
    .map((item) => {
      const isActive = item.id === currentId;
      const isCompleted =
        item.kind === "lesson"
          ? completedLessons.includes(item.id)
          : passedAssessments.has(item.id);
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      const cssClass =
        item.kind === "assessment" ? "lxpack-nav-assessment" : "";

      return `
      <button
        type="button"
        class="lxpack-nav-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${cssClass}"
        data-nav-id="${escapeHtml(item.id)}"
        ${ariaCurrent}
      >
        ${escapeHtml(item.title)}${item.kind === "assessment" ? " (Quiz)" : ""}
      </button>
    `;
    })
    .join("");

  navEl.querySelectorAll(".lxpack-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.navId;
      if (id) onSelect(id);
    });
  });
}

function updateProgressBar(ratio: number): void {
  const fill = document.getElementById("lxpack-progress-fill");
  const bar = document.querySelector(".lxpack-progress-bar");
  const pct = Math.round(ratio * 100);
  if (fill) fill.style.width = `${pct}%`;
  if (bar) {
    bar.setAttribute("aria-valuenow", String(pct));
  }
}

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

async function renderItem(
  config: RuntimeConfig,
  runtime: LxpackRuntime,
  contentEl: HTMLElement,
  baseUrl: string,
  item: NavItem,
  onSubmitted: () => void,
): Promise<void> {
  if (item.kind === "lesson") {
    const lesson = item.lesson;
    if (lesson.type === "markdown" && lesson.file) {
      await renderMarkdown(contentEl, baseUrl, lesson.file);
    } else if (lesson.type === "html" && lesson.path) {
      renderHtmlInteraction(contentEl, baseUrl, lesson.path);
    } else if (lesson.type === "component") {
      renderComponentLesson(
        contentEl,
        lesson.component,
        lesson.props,
        baseUrl,
      );
    } else {
      contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
    }
  } else {
    const { assessment, answerKey, payload } = await loadAssessment(
      config,
      baseUrl,
      item.id,
      item.file,
    );
    renderAssessment(contentEl, payload ?? {
      ...assessment,
      config: config.assessmentConfigs?.[item.id] ?? {
        maxAttempts: 1,
        shuffleChoices: false,
        showFeedback: "never",
      },
      feedback: config.assessmentFeedback?.[item.id],
    }, answerKey, runtime, onSubmitted);
  }
}

export function init(): void {
  const config = getConfig();
  const runtime = new LxpackRuntime({
    manifest: config.manifest,
    baseUrl: config.baseUrl,
    mode: config.mode,
    progress: config.progress,
    assessments: config.assessments,
    answerKeys: config.answerKeys,
  });

  const lxpackApi = runtime.getAPI();
  window.lxpack = lxpackApi;
  renderShell(config.manifest);

  const navEl = document.querySelector(".lxpack-nav") as HTMLElement;
  const contentEl = document.getElementById("lxpack-content") as HTMLElement;
  const prevBtn = document.getElementById("lxpack-prev") as HTMLButtonElement;
  const nextBtn = document.getElementById("lxpack-next") as HTMLButtonElement;
  const completeBtn = document.getElementById(
    "lxpack-complete",
  ) as HTMLButtonElement;

  const navItems = buildNavItems(config.manifest);
  const activityOrder = buildActivityOrder(config.manifest);

  function indexForId(id: string): number {
    const idx = navItems.findIndex((n) => n.id === id);
    return idx >= 0 ? idx : 0;
  }

  let currentIndex = indexForId(runtime.getProgress().currentLessonId);

  let renderSeq = 0;

  function applyFlowJump(): void {
    const target = runtime.resolveFlowNavigation();
    if (target && target !== navItems[currentIndex]?.id) {
      const idx = navItems.findIndex((n) => n.id === target);
      if (idx >= 0) {
        void showItem(idx);
      }
    }
  }

  function getPassedAssessments(): Set<string> {
    const passed = new Set<string>();
    for (const ref of config.manifest.assessments ?? []) {
      if (runtime.isAssessmentPassed(ref.id)) {
        passed.add(ref.id);
      }
    }
    return passed;
  }

  async function showItem(index: number): Promise<void> {
    const item = navItems[index];
    if (!item) return;

    const seq = ++renderSeq;
    runtime.setCurrentLesson(item.id);
    currentIndex = index;

    try {
      await renderItem(config, runtime, contentEl, config.baseUrl, item, () => {
        void showItem(currentIndex);
      });
    } catch (err) {
      /* v8 ignore next -- stale async navigation */
      if (seq !== renderSeq) return;
      const message = err instanceof Error ? err.message : String(err);
      contentEl.innerHTML = `<p class="lxpack-error">${escapeHtml(message)}</p>`;
    }

    if (seq !== renderSeq) return;

    renderNav(
      navEl,
      navItems,
      item.id,
      runtime.getProgress().completedLessons,
      getPassedAssessments(),
      (id) => {
        const idx = navItems.findIndex((n) => n.id === id);
        if (idx >= 0) void showItem(idx);
      },
    );

    updateProgressBar(runtime.getCompletionRatio());

    const currentId = navItems[index]?.id ?? "";
    const hasFlow = Boolean(config.manifest.flow?.length);
    const atStart = activityOrder.indexOf(currentId) <= 0;
    const atEnd =
      activityOrder.indexOf(currentId) >= activityOrder.length - 1 &&
      !hasFlow;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd && !hasFlow;

    const isLesson = item.kind === "lesson";
    completeBtn.hidden = !isLesson;
    if (isLesson) {
      completeBtn.textContent = runtime.isLessonComplete(item.id)
        ? "Completed"
        : "Mark complete";
      completeBtn.disabled = runtime.isLessonComplete(item.id);
    }
  }

  prevBtn.addEventListener("click", () => {
    const id = navItems[currentIndex]?.id;
    if (!id) return;
    const prevId = resolvePreviousActivityId(config.manifest, id);
    if (prevId) {
      const idx = navItems.findIndex((n) => n.id === prevId);
      if (idx >= 0) void showItem(idx);
      return;
    }
    if (currentIndex > 0) void showItem(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    const id = navItems[currentIndex]?.id;
    if (!id) return;
    const nextId = resolveNextActivityId(
      config.manifest,
      id,
      runtime.getFlowContext(),
    );
    if (nextId) {
      const idx = navItems.findIndex((n) => n.id === nextId);
      if (idx >= 0) void showItem(idx);
      return;
    }
    if (currentIndex < navItems.length - 1) void showItem(currentIndex + 1);
  });

  completeBtn.addEventListener("click", () => {
    const item = navItems[currentIndex];
    if (item?.kind === "lesson") {
      runtime.completeLesson(item.id);
      applyFlowJump();
      void showItem(currentIndex);
    }
  });

  const originalTrack = lxpackApi.track.bind(lxpackApi);
  lxpackApi.track = (event) => {
    originalTrack(event);
    if (event.type === "interaction" || event.type === "assessment") {
      applyFlowJump();
    }
  };

  const terminate = () => runtime.terminate();
  window.addEventListener("beforeunload", terminate);
  window.addEventListener("pagehide", terminate);

  void showItem(currentIndex);
}

export function bootstrapClient(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

export { renderAssessment, scoreAssessmentForm as scoreAssessment } from "./quiz/index.js";

/* v8 ignore start -- entry guard: auto-bootstrap only outside test */
const isTestEnv = process.env.VITEST === "true";

if (!isTestEnv) {
  bootstrapClient();
}
/* v8 ignore end */
