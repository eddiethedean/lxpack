import {
  buildActivityOrder,
  resolveNextActivityId,
  resolvePreviousActivityId,
} from "../flow.js";
import { LxpackRuntime } from "../runtime.js";
import { getConfig } from "./types.js";
import { buildNavItems, renderNav } from "./nav.js";
import { renderShell, updateProgressBar } from "./shell.js";
import { renderItem } from "./render-item.js";
import { escapeHtml } from "./html-utils.js";
import { isInteractionComplete } from "../interaction-complete.js";
import { createLxpackBridgeHost } from "@lxpack/spa-bridge";

export function init(): void {
  const config = getConfig();
  const runtime = new LxpackRuntime({
    manifest: config.manifest,
    baseUrl: config.baseUrl,
    mode: config.mode,
    activityId: config.activityId,
    activityIri: config.activityIri,
    xapi: config.xapi,
    progress: config.progress,
    assessments: config.assessments,
    answerKeys: config.answerKeys,
    assessmentConfigs: config.assessmentConfigs,
    assessmentFeedback: config.assessmentFeedback,
  });

  const lxpackApi = runtime.getAPI();
  window.lxpack = lxpackApi;

  window.lxpackBridge = createLxpackBridgeHost({
    completeLesson: (lessonId) => runtime.completeLesson(lessonId),
    completeCourse: () => runtime.completeCourse(),
    submitAssessment: (id, score, passingScore) =>
      runtime.submitAssessment(id, score, passingScore),
    track: (event) => lxpackApi.track(event as never),
  });

  renderShell(config.manifest);

  const navEl = document.querySelector(".lxpack-nav") as HTMLElement;
  const contentEl = document.getElementById("lxpack-content") as HTMLElement;
  const prevBtn = document.getElementById("lxpack-prev") as HTMLButtonElement;
  const nextBtn = document.getElementById("lxpack-next") as HTMLButtonElement;
  const completeBtn = document.getElementById(
    "lxpack-complete",
  ) as HTMLButtonElement;

  const scorm2004SingleSco =
    config.mode === "scorm2004" && Boolean(config.activityId);
  const allNavItems = buildNavItems(config.manifest);
  const navItems = scorm2004SingleSco
    ? allNavItems.filter((n) => n.id === config.activityId)
    : allNavItems;
  const activityOrder = scorm2004SingleSco
    ? navItems.map((n) => n.id)
    : buildActivityOrder(config.manifest);

  function indexForId(id: string): number {
    const idx = navItems.findIndex((n) => n.id === id);
    if (idx >= 0) return idx;
    if (id) {
      console.warn(
        `[lxpack] Stored lesson id "${id}" is not in this course; opening the first activity`,
      );
    }
    return 0;
  }

  let currentIndex = indexForId(runtime.getProgress().currentLessonId);

  let renderSeq = 0;

  function applyFlowJump(): boolean {
    const target = runtime.resolveFlowNavigation();
    if (target && target !== navItems[currentIndex]?.id) {
      const idx = navItems.findIndex((n) => n.id === target);
      if (idx >= 0) {
        void showItem(idx);
        return true;
      }
      if (scorm2004SingleSco) {
        console.warn(
          `[lxpack] Flow goto "${target}" is not available in this SCORM launch activity`,
        );
      }
    }
    return false;
  }

  function isNavItemReachable(
    targetId: string,
    options?: { allowLinearPrevious?: boolean },
  ): boolean {
    const hasFlow = Boolean(config.manifest.flow?.length);
    if (!hasFlow) return true;
    const currentId = navItems[currentIndex]?.id ?? "";
    if (targetId === currentId) return true;
    const flowTarget = runtime.resolveFlowNavigation();
    if (flowTarget === targetId) return true;
    if (!currentId) return targetId === navItems[0]?.id;
    const nextId = resolveNextActivityId(
      config.manifest,
      currentId,
      runtime.getFlowContext(),
    );
    if (nextId === targetId) return true;
    if (options?.allowLinearPrevious) {
      const prevId = resolvePreviousActivityId(config.manifest, currentId);
      if (prevId === targetId) return true;
    }
    return false;
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
        if (!isNavItemReachable(id)) return;
        const idx = navItems.findIndex((n) => n.id === id);
        if (idx >= 0) void showItem(idx);
      },
      (id) => isNavItemReachable(id, { allowLinearPrevious: true }),
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
    if (prevId && isNavItemReachable(prevId)) {
      const idx = navItems.findIndex((n) => n.id === prevId);
      if (idx >= 0) {
        void showItem(idx);
        return;
      }
    }
    const hasFlow = Boolean(config.manifest.flow?.length);
    if (!hasFlow && currentIndex > 0) void showItem(currentIndex - 1);
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
      if (idx >= 0) {
        void showItem(idx);
        return;
      }
    }
    if (currentIndex < navItems.length - 1) void showItem(currentIndex + 1);
  });

  completeBtn.addEventListener("click", () => {
    const item = navItems[currentIndex];
    if (item?.kind === "lesson") {
      runtime.completeLesson(item.id);
      if (!applyFlowJump()) {
        void showItem(currentIndex);
      }
    }
  });

  const originalTrack = lxpackApi.track.bind(lxpackApi);
  lxpackApi.track = (event) => {
    originalTrack(event);
    if (event.type === "interaction") {
      const item = navItems[currentIndex];
      if (
        isInteractionComplete(event.data) &&
        item?.kind === "lesson" &&
        (item.lesson.type === "html" || item.lesson.type === "spa")
      ) {
        runtime.markInteractionLessonDone(item.id);
      }
    }
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
