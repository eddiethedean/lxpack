import type { RuntimeConfig } from "../types.js";
import type { AssessmentHost } from "../quiz/host.js";
import { renderAssessment } from "../quiz/index.js";
import { loadAssessment } from "./assessment-loader.js";
import { getLessonRenderer } from "./lessons/registry.js";
import type { NavItem } from "./types.js";

export async function renderItem(
  config: RuntimeConfig,
  runtime: AssessmentHost,
  contentEl: HTMLElement,
  baseUrl: string,
  item: NavItem,
  onSubmitted: () => void,
): Promise<void> {
  if (item.kind === "lesson") {
    const renderer = getLessonRenderer(item.lesson.type);
    if (!renderer) {
      contentEl.innerHTML = `<p class="lxpack-error">No renderer registered for lesson type: ${item.lesson.type}</p>`;
      return;
    }
    await renderer(item.lesson, { contentEl, baseUrl });
    return;
  }

  const { assessment, answerKey, payload } = await loadAssessment(
    config,
    baseUrl,
    item.id,
    item.file,
  );
  renderAssessment(
    contentEl,
    payload ?? {
      ...assessment,
      config: config.assessmentConfigs?.[item.id] ?? {
        maxAttempts: 1,
        shuffleChoices: false,
        showFeedback: "never",
      },
      feedback: config.assessmentFeedback?.[item.id],
    },
    answerKey,
    runtime,
    onSubmitted,
  );
}
