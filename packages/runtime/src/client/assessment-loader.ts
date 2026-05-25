import { parse as parseYaml } from "yaml";
import type { LearnerAssessment } from "@lxpack/validators";
import type { RuntimeConfig } from "../types.js";
import type { RuntimeAssessmentPayload } from "../quiz/types.js";
import { joinUrl } from "./html-utils.js";

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
  const exportMode =
    config.mode === "scorm12" ||
    config.mode === "scorm2004" ||
    config.mode === "standalone" ||
    config.mode === "xapi" ||
    config.mode === "cmi5";

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

  if (exportMode) {
    throw new Error(
      `Assessment "${assessmentId}" is not embedded in this package. Rebuild the course with lxpack build.`,
    );
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
