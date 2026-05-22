import { marked } from "marked";
import type { CourseManifest, Lesson } from "@lxpack/validators";
import { LxpackRuntime } from "./runtime.js";
import type { CourseProgress } from "./types.js";

declare global {
  interface Window {
    lxpack?: ReturnType<LxpackRuntime["getAPI"]>;
    __LXPACK_CONFIG__?: {
      manifest: CourseManifest;
      baseUrl: string;
      mode: "preview" | "standalone" | "scorm12";
      progress?: CourseProgress;
    };
  }
}

function getConfig() {
  const config = window.__LXPACK_CONFIG__;
  if (!config) {
    throw new Error("LXPack runtime config not found");
  }
  return config;
}

function renderShell(manifest: CourseManifest): HTMLElement {
  const app = document.getElementById("lxpack-app");
  if (!app) throw new Error("#lxpack-app element not found");

  app.innerHTML = `
    <div class="lxpack-layout">
      <header class="lxpack-header">
        <h1 class="lxpack-title">${escapeHtml(manifest.title)}</h1>
        <p class="lxpack-version">v${escapeHtml(manifest.version)}</p>
      </header>
      <div class="lxpack-body">
        <nav class="lxpack-nav" aria-label="Course lessons"></nav>
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

async function renderMarkdown(
  contentEl: HTMLElement,
  baseUrl: string,
  file: string,
): Promise<void> {
  const res = await fetch(`${baseUrl}/${file}`);
  if (!res.ok) throw new Error(`Failed to load lesson: ${file}`);
  const md = await res.text();
  contentEl.innerHTML = `<article class="lxpack-markdown">${await marked.parse(md)}</article>`;
}

function renderHtmlInteraction(
  contentEl: HTMLElement,
  baseUrl: string,
  path: string,
): void {
  contentEl.innerHTML = `
    <iframe
      class="lxpack-interaction-frame"
      src="${baseUrl}/${path}/index.html"
      title="Interaction"
      sandbox="allow-scripts allow-same-origin allow-forms"
    ></iframe>
  `;
}

function renderNav(
  navEl: HTMLElement,
  lessons: Lesson[],
  currentId: string,
  completed: string[],
  onSelect: (id: string) => void,
): void {
  navEl.innerHTML = lessons
    .map(
      (lesson) => `
      <button
        type="button"
        class="lxpack-nav-item ${lesson.id === currentId ? "active" : ""} ${completed.includes(lesson.id) ? "completed" : ""}"
        data-lesson-id="${lesson.id}"
        aria-current="${lesson.id === currentId ? "page" : "false"}"
      >
        ${escapeHtml(lesson.title ?? lesson.id)}
      </button>
    `,
    )
    .join("");

  navEl.querySelectorAll(".lxpack-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.lessonId;
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

async function renderLesson(
  _runtime: LxpackRuntime,
  contentEl: HTMLElement,
  baseUrl: string,
  lesson: Lesson,
): Promise<void> {
  if (lesson.type === "markdown" && lesson.file) {
    await renderMarkdown(contentEl, baseUrl, lesson.file);
  } else if (lesson.type === "html" && lesson.path) {
    renderHtmlInteraction(contentEl, baseUrl, lesson.path);
  } else {
    contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
  }
}

function init(): void {
  const config = getConfig();
  const runtime = new LxpackRuntime({
    manifest: config.manifest,
    baseUrl: config.baseUrl,
    mode: config.mode,
    progress: config.progress,
  });

  window.lxpack = runtime.getAPI();
  renderShell(config.manifest);

  const navEl = document.querySelector(".lxpack-nav") as HTMLElement;
  const contentEl = document.getElementById("lxpack-content") as HTMLElement;
  const prevBtn = document.getElementById("lxpack-prev") as HTMLButtonElement;
  const nextBtn = document.getElementById("lxpack-next") as HTMLButtonElement;
  const completeBtn = document.getElementById(
    "lxpack-complete",
  ) as HTMLButtonElement;

  const lessons = config.manifest.lessons;
  let currentIndex = lessons.findIndex(
    (l) => l.id === runtime.getProgress().currentLessonId,
  );
  if (currentIndex < 0) currentIndex = 0;

  async function showLesson(index: number): Promise<void> {
    const lesson = lessons[index];
    if (!lesson) return;

    runtime.setCurrentLesson(lesson.id);
    currentIndex = index;

    await renderLesson(runtime, contentEl, config.baseUrl, lesson);

    renderNav(
      navEl,
      lessons,
      lesson.id,
      runtime.getProgress().completedLessons,
      (id) => {
        const idx = lessons.findIndex((l) => l.id === id);
        if (idx >= 0) void showLesson(idx);
      },
    );

    updateProgressBar(runtime.getCompletionRatio());

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === lessons.length - 1;
    completeBtn.textContent = runtime.isLessonComplete(lesson.id)
      ? "Completed"
      : "Mark complete";
    completeBtn.disabled = runtime.isLessonComplete(lesson.id);
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) void showLesson(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < lessons.length - 1) void showLesson(currentIndex + 1);
  });

  completeBtn.addEventListener("click", () => {
    const lesson = lessons[currentIndex];
    if (lesson) {
      runtime.completeLesson(lesson.id);
      void showLesson(currentIndex);
    }
  });

  window.addEventListener("beforeunload", () => runtime.terminate());

  void showLesson(currentIndex);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
