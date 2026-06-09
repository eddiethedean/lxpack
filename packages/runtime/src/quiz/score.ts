import type { AnswerKeyValue, LearnerAssessment, LearnerQuestion } from "@lxpack/validators";

function isMultipleQuestion(
  question: LearnerQuestion,
  answerKey: AnswerKeyValue | undefined,
): boolean {
  return (
    question.selectionMode === "multiple" || Array.isArray(answerKey)
  );
}

function scoreQuestion(
  question: LearnerQuestion,
  answerKey: AnswerKeyValue | undefined,
  form: HTMLFormElement,
): number {
  if (!answerKey) return 0;

  if (!isMultipleQuestion(question, answerKey)) {
    const correctId = Array.isArray(answerKey) ? answerKey[0] : answerKey;
    const selected = form.querySelector(
      `input[name="q-${question.id}"]:checked`,
    ) as HTMLInputElement | null;
    return selected && correctId && selected.value === correctId ? 1 : 0;
  }

  const correctIds = new Set(
    Array.isArray(answerKey) ? answerKey : [answerKey],
  );
  const selected = Array.from(
    form.querySelectorAll(`input[name="q-${question.id}"]:checked`),
  ).map((el) => (el as HTMLInputElement).value);

  if (selected.some((id) => !correctIds.has(id))) {
    return 0;
  }

  const correctSelected = selected.filter((id) => correctIds.has(id)).length;
  return correctIds.size ? correctSelected / correctIds.size : 0;
}

export function scoreAssessmentForm(
  assessment: LearnerAssessment,
  answerKey: Record<string, AnswerKeyValue>,
  form: HTMLFormElement,
): number {
  let total = 0;
  for (const q of assessment.questions) {
    total += scoreQuestion(q, answerKey[q.id], form);
  }
  return assessment.questions.length ? total / assessment.questions.length : 0;
}

export function shuffleQuestions<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function getAttemptCount(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): number {
  const raw = suspendData[`assessment_attempts_${assessmentId}`];
  let count = 0;
  if (typeof raw === "number") count = raw;
  else if (typeof raw === "string" && raw !== "" && !Number.isNaN(Number(raw))) {
    count = Number(raw);
  }
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.floor(count);
}

export function incrementAttemptCount(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): number {
  const next = getAttemptCount(suspendData, assessmentId) + 1;
  suspendData[`assessment_attempts_${assessmentId}`] = next;
  return next;
}

export function isAssessmentExhaustedFlag(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): boolean {
  return suspendData[`assessment_exhausted_${assessmentId}`] === true;
}

export function isAssessmentPassedFlag(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): boolean {
  return suspendData[`assessment_passed_${assessmentId}`] === true;
}

export function removeAssessmentAttemptKey(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): void {
  delete suspendData[`assessment_attempts_${assessmentId}`];
}
