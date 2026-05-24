import type { RuntimeConfig } from "../types.js";
import type { AssessmentHost } from "../quiz/host.js";
import { renderAssessment } from "../quiz/index.js";
import { loadAssessment } from "./assessment-loader.js";
import { lessonRenderers } from "./lessons/registry.js";
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
    const renderer = lessonRenderers[item.lesson.type];
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
