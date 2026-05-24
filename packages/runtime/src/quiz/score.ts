import type { LearnerAssessment } from "@lxpack/validators";

export function scoreAssessmentForm(
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
  return typeof raw === "number" ? raw : 0;
}

export function incrementAttemptCount(
  suspendData: Record<string, unknown>,
  assessmentId: string,
): number {
  const next = getAttemptCount(suspendData, assessmentId) + 1;
  suspendData[`assessment_attempts_${assessmentId}`] = next;
  return next;
}
