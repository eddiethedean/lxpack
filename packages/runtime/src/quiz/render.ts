import type { AnswerKeyValue } from "@lxpack/validators";
import type { AssessmentHost } from "./host.js";
import {
  DEFAULT_ASSESSMENT_CONFIG,
  type RuntimeAssessmentPayload,
} from "./types.js";
import {
  isAssessmentExhaustedFlag,
  scoreAssessmentForm,
  shuffleQuestions,
} from "./score.js";

function isMultipleQuestion(
  selectionMode: "single" | "multiple" | undefined,
  answerKey: AnswerKeyValue | undefined,
): boolean {
  return selectionMode === "multiple" || Array.isArray(answerKey);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function renderAssessment(
  contentEl: HTMLElement,
  payload: RuntimeAssessmentPayload,
  answerKey: Record<string, AnswerKeyValue>,
  runtime: AssessmentHost,
  onSubmitted: () => void,
): void {
  const { config: configOverrides, feedback, ...assessment } = payload;
  const config = { ...DEFAULT_ASSESSMENT_CONFIG, ...configOverrides };
  const progress = runtime.getProgress();
  const existingScore = progress.assessmentScores[assessment.id];
  const passed = runtime.isAssessmentPassed(assessment.id);
  const attempts = runtime.getAssessmentAttemptCount(assessment.id);
  const effectiveAttempts =
    existingScore !== undefined ? Math.max(attempts, 1) : attempts;
  const retakesRemaining = config.maxAttempts - effectiveAttempts;
  const exhausted = isAssessmentExhaustedFlag(
    progress.suspendData,
    assessment.id,
  );

  if (
    (attempts >= config.maxAttempts && existingScore === undefined) ||
    (exhausted && !passed && existingScore === undefined)
  ) {
    contentEl.innerHTML = `
      <article class="lxpack-assessment lxpack-assessment-result">
        <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
        <p class="lxpack-error">
          No attempts remaining (maximum: ${config.maxAttempts}).
          ${attempts > 0 ? ` · Attempts used: ${attempts}` : ""}
        </p>
      </article>
    `;
    return;
  }

  if (passed && existingScore === undefined) {
    contentEl.innerHTML = `
      <article class="lxpack-assessment lxpack-assessment-result">
        <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
        <p class="lxpack-success-text">
          Passed (required: ${Math.round(assessment.passingScore * 100)}%)
        </p>
      </article>
    `;
    return;
  }

  if (existingScore !== undefined && (passed || retakesRemaining <= 0)) {
    contentEl.innerHTML = `
      <article class="lxpack-assessment lxpack-assessment-result">
        <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
        <p class="${passed ? "lxpack-success-text" : "lxpack-error"}">
          Score: ${Math.round(existingScore * 100)}% —
          ${passed ? "Passed" : "Not passed"}
          (required: ${Math.round(assessment.passingScore * 100)}%)
          ${attempts > 1 ? ` · Attempts: ${attempts}` : ""}
        </p>
      </article>
    `;
    return;
  }

  let questions = assessment.questions;
  if (config.shuffleChoices) {
    questions = shuffleQuestions(questions).map((q) => ({
      ...q,
      choices: shuffleQuestions(q.choices),
    }));
  }

  const questionsHtml = questions
    .map(
      (q, qi) => {
        const multiple = isMultipleQuestion(q.selectionMode, answerKey[q.id]);
        const inputType = multiple ? "checkbox" : "radio";
        return `
      <fieldset class="lxpack-question" data-question-id="${escapeHtml(q.id)}">
        <legend>${qi + 1}. ${escapeHtml(q.prompt)}</legend>
        ${
          multiple
            ? `<p class="lxpack-hint lxpack-select-all-hint">Select all that apply.</p>`
            : ""
        }
        ${q.choices
          .map(
            (c) => `
          <label class="lxpack-choice">
            <input type="${inputType}" name="q-${escapeHtml(q.id)}" value="${escapeHtml(c.id)}" />
            ${escapeHtml(c.text)}
          </label>
        `,
          )
          .join("")}
        ${
          config.showFeedback === "immediate" && feedback?.[q.id]
            ? `<p class="lxpack-hint lxpack-feedback-immediate" hidden data-feedback-for="${escapeHtml(q.id)}">${escapeHtml(feedback[q.id]!)}</p>`
            : ""
        }
      </fieldset>
    `;
      },
    )
    .join("");

  const remaining = Math.max(0, config.maxAttempts - effectiveAttempts);

  contentEl.innerHTML = `
    <article class="lxpack-assessment">
      <h2>${escapeHtml(assessment.title ?? assessment.id)}</h2>
      ${
        config.maxAttempts > 1
          ? `<p class="lxpack-hint">Attempts remaining: ${remaining}</p>`
          : ""
      }
      <form id="lxpack-assessment-form">
        ${questionsHtml}
        <button type="submit" class="lxpack-complete-btn">Submit assessment</button>
      </form>
      <div
        id="lxpack-assessment-feedback"
        class="lxpack-assessment-feedback"
        ${
          config.showFeedback === "immediate" || config.showFeedback === "end"
            ? 'aria-live="polite"'
            : ""
        }
        hidden
      ></div>
    </article>
  `;

  const form = contentEl.querySelector("#lxpack-assessment-form") as HTMLFormElement;
  const feedbackEl = contentEl.querySelector(
    "#lxpack-assessment-feedback",
  ) as HTMLElement;

  if (config.showFeedback === "immediate") {
    form.querySelectorAll('input[type="radio"]').forEach((input) => {
      // Multi-select questions require explicit submit before feedback.
      input.addEventListener("change", () => {
        const el = input as HTMLInputElement;
        const qid = el.name.replace(/^q-/, "");
        const hint = form.querySelector(
          `[data-feedback-for="${qid}"]`,
        ) as HTMLElement | null;
        if (hint) hint.hidden = false;
      });
    });
  }

  let submitting = false;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitting) return;
    submitting = true;
    const submitBtn = form.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    if (submitBtn) submitBtn.disabled = true;

    const score = scoreAssessmentForm(assessment, answerKey, form);
    const passedNow = score >= assessment.passingScore;
    runtime.submitAssessment(assessment.id, score, assessment.passingScore);

    if (config.showFeedback === "end" || config.showFeedback === "immediate") {
      feedbackEl.hidden = false;
      const lines =
        config.showFeedback === "end" && feedback
          ? Object.entries(feedback)
              .filter(([, text]) => text)
              .map(([qid, text]) => `<p><strong>${escapeHtml(qid)}:</strong> ${escapeHtml(text!)}</p>`)
              .join("")
          : "";
      feedbackEl.innerHTML = `
        <p class="${passedNow ? "lxpack-success-text" : "lxpack-error"}">
          Score: ${Math.round(score * 100)}% —
          ${passedNow ? "Passed!" : "Not passed."}
          (required: ${Math.round(assessment.passingScore * 100)}%)
        </p>
        ${lines}
      `;
    }

    const canRetry =
      !passedNow &&
      runtime.getAssessmentAttemptCount(assessment.id) < config.maxAttempts;

    if (!canRetry) {
      form.querySelector("button[type=submit]")?.remove();
    }

    onSubmitted();
  });
}
