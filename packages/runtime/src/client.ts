import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import type { CourseManifest, LearnerAssessment, Lesson } from "@lxpack/validators";
import { LxpackRuntime } from "./runtime.js";
import type { RuntimeConfig } from "./types.js";

marked.setOptions({ gfm: true, breaks: true });

declare global {
  interface Window {
    lxpack?: ReturnType<LxpackRuntime["getAPI"]>;
    __LXPACK_CONFIG__?: RuntimeConfig;
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
): Promise<{ assessment: LearnerAssessment; answerKey: Record<string, string> }> {
  const embedded = config.assessments?.[assessmentId];
  if (embedded) {
    const answerKey = config.answerKeys?.[assessmentId] ?? {};
    return { assessment: embedded, answerKey };
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

export function scoreAssessment(
  assessment: LearnerAssessment,
  answerKey: Record<string, string>,
  form: HTMLFormElement,
): number {
  let correct = 0;
  for (const q of assessment.questions) {
    const selected = form.querySelector(
      `input[name="q-${q.id}"]:checked`,
    ) as HTMLInputElement | null;
    const correctId = answerKey[q.id];
    if (selected && correctId && selected.value === correctId) {
      correct++;
    }
  }
  return assessment.questions.length ? correct / assessment.questions.length : 0;
}

export function renderAssessment(
  contentEl: HTMLElement,
  assessment: LearnerAssessment,
  answerKey: Record<string, string>,
  runtime: LxpackRuntime,
  onSubmitted: () => void,
): void {
  const existingScore = runtime.getProgress().assessmentScores[assessment.id];
  const passed = runtime.isAssessmentPassed(assessment.id);

  if (existingScore !== undefined) {
    contentEl.innerHTML = `
      <article class="lxpack-assessment lxpack-assessment-result">
        <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
        <p class="${passed ? "lxpack-success-text" : "lxpack-error"}">
          Score: ${Math.round(existingScore * 100)}% —
          ${passed ? "Passed" : "Not passed"}
          (required: ${Math.round(assessment.passingScore * 100)}%)
        </p>
      </article>
    `;
    return;
  }

  const questionsHtml = assessment.questions
    .map(
      (q, qi) => `
      <fieldset class="lxpack-question" data-question-id="${escapeHtml(q.id)}">
        <legend>${qi + 1}. ${escapeHtml(q.prompt)}</legend>
        ${q.choices
          .map(
            (c) => `
          <label class="lxpack-choice">
            <input type="radio" name="q-${escapeHtml(q.id)}" value="${escapeHtml(c.id)}" />
            ${escapeHtml(c.text)}
          </label>
        `,
          )
          .join("")}
      </fieldset>
    `,
    )
    .join("");

  contentEl.innerHTML = `
    <article class="lxpack-assessment">
      <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
      <form id="lxpack-assessment-form">
        ${questionsHtml}
        <button type="submit" class="lxpack-complete-btn">Submit assessment</button>
      </form>
      <div id="lxpack-assessment-feedback" class="lxpack-assessment-feedback" hidden></div>
    </article>
  `;

  const form = contentEl.querySelector("#lxpack-assessment-form") as HTMLFormElement;
  const feedback = contentEl.querySelector(
    "#lxpack-assessment-feedback",
  ) as HTMLElement;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const score = scoreAssessment(assessment, answerKey, form);
    const passedNow = score >= assessment.passingScore;

    runtime.submitAssessment(assessment.id, score, assessment.passingScore);

    feedback.hidden = false;
    feedback.innerHTML = `
      <p class="${passedNow ? "lxpack-success-text" : "lxpack-error"}">
        Score: ${Math.round(score * 100)}% —
        ${passedNow ? "Passed!" : "Not passed."}
        (required: ${Math.round(assessment.passingScore * 100)}%)
      </p>
    `;

    form.querySelector("button[type=submit]")?.remove();
    onSubmitted();
  });
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
    } else {
      contentEl.innerHTML = `<p class="lxpack-error">Invalid lesson configuration</p>`;
    }
  } else {
    const { assessment, answerKey } = await loadAssessment(
      config,
      baseUrl,
      item.id,
      item.file,
    );
    renderAssessment(contentEl, assessment, answerKey, runtime, onSubmitted);
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

  window.lxpack = runtime.getAPI();
  renderShell(config.manifest);

  const navEl = document.querySelector(".lxpack-nav") as HTMLElement;
  const contentEl = document.getElementById("lxpack-content") as HTMLElement;
  const prevBtn = document.getElementById("lxpack-prev") as HTMLButtonElement;
  const nextBtn = document.getElementById("lxpack-next") as HTMLButtonElement;
  const completeBtn = document.getElementById(
    "lxpack-complete",
  ) as HTMLButtonElement;

  const navItems = buildNavItems(config.manifest);
  let currentIndex = navItems.findIndex(
    (item) => item.id === runtime.getProgress().currentLessonId,
  );
  if (currentIndex < 0) currentIndex = 0;

  let renderSeq = 0;

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

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === navItems.length - 1;

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
    if (currentIndex > 0) void showItem(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < navItems.length - 1) void showItem(currentIndex + 1);
  });

  completeBtn.addEventListener("click", () => {
    const item = navItems[currentIndex];
    if (item?.kind === "lesson") {
      runtime.completeLesson(item.id);
      void showItem(currentIndex);
    }
  });

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

/* v8 ignore start -- entry guard: auto-bootstrap only outside test */
const isTestEnv = process.env.VITEST === "true";

if (!isTestEnv) {
  bootstrapClient();
}
/* v8 ignore end */
