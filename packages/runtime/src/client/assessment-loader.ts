import { parse as parseYaml } from "yaml";
import type {
  AnswerKeyValue,
  AssessmentRuntimeConfig,
  LearnerAssessment,
  QuestionFeedback,
  SelectionMode,
} from "@lxpack/validators";
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
  answerKey: Record<string, AnswerKeyValue>;
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
    maxAttempts?: number;
    shuffleChoices?: boolean;
    showFeedback?: AssessmentRuntimeConfig["showFeedback"];
    questions: Array<{
      id: string;
      prompt: string;
      explanation?: string;
      selectionMode?: SelectionMode;
      choices: Array<{ id: string; text: string; correct?: boolean }>;
    }>;
  };

  const answerKey: Record<string, AnswerKeyValue> = {};
  for (const q of raw.questions ?? []) {
    const correctChoices = (q.choices ?? []).filter(
      (c) => "correct" in c && c.correct === true,
    );
    const selectionMode =
      q.selectionMode ??
      (correctChoices.length > 1 ? ("multiple" as const) : ("single" as const));
    if (selectionMode === "multiple") {
      answerKey[q.id] = correctChoices.map((c) => c.id);
    } else if (correctChoices[0]) {
      answerKey[q.id] = correctChoices[0].id;
    }
  }

  const assessment: LearnerAssessment = {
    id: raw.id ?? assessmentId,
    title: raw.title,
    passingScore: raw.passingScore ?? 0.7,
    questions: (raw.questions ?? []).map((q) => {
      const correctChoices = (q.choices ?? []).filter(
        (c) => "correct" in c && c.correct === true,
      );
      const selectionMode =
        q.selectionMode ??
        (correctChoices.length > 1 ? ("multiple" as const) : ("single" as const));
      return {
        id: q.id,
        prompt: q.prompt,
        choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
        selectionMode,
      };
    }),
  };

  const assessmentConfig: AssessmentRuntimeConfig = {
    maxAttempts: raw.maxAttempts ?? 1,
    shuffleChoices: raw.shuffleChoices ?? false,
    showFeedback: raw.showFeedback ?? "never",
  };

  const feedback: QuestionFeedback = {};
  for (const q of raw.questions ?? []) {
    if (q.explanation) {
      feedback[q.id] = q.explanation;
    }
  }

  return {
    assessment,
    answerKey,
    payload: {
      ...assessment,
      config: assessmentConfig,
      feedback: Object.keys(feedback).length ? feedback : undefined,
    },
  };
}
