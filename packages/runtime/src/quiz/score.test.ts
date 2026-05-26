import { describe, expect, it } from "vitest";
import {
  getAttemptCount,
  incrementAttemptCount,
  scoreAssessmentForm,
  shuffleQuestions,
} from "./score.js";

const assessment = {
  id: "quiz",
  title: "Quiz",
  passingScore: 0.7,
  questions: [
    {
      id: "q1",
      prompt: "One",
      choices: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
    },
    {
      id: "q2",
      prompt: "Two",
      choices: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
    },
  ],
};

describe("scoreAssessmentForm", () => {
  it("scores partial answers against all questions", () => {
    const form = document.createElement("form");
    form.innerHTML = `
      <input type="radio" name="q-q1" value="a" checked />
      <input type="radio" name="q-q2" value="b" />
    `;
    const score = scoreAssessmentForm(assessment, { q1: "a", q2: "a" }, form);
    expect(score).toBe(0.5);
  });

  it("treats missing answer keys as incorrect", () => {
    const form = document.createElement("form");
    form.innerHTML = `<input type="radio" name="q-q1" value="a" checked />`;
    const score = scoreAssessmentForm(assessment, {}, form);
    expect(score).toBe(0);
  });
});

describe("getAttemptCount", () => {
  it("coerces string attempt counts", () => {
    expect(
      getAttemptCount({ assessment_attempts_quiz: "2" }, "quiz"),
    ).toBe(2);
  });

  it("returns zero for invalid values", () => {
    expect(getAttemptCount({ assessment_attempts_quiz: -1 }, "quiz")).toBe(0);
  });
});

describe("incrementAttemptCount", () => {
  it("increments suspend_data", () => {
    const suspend: Record<string, unknown> = {};
    expect(incrementAttemptCount(suspend, "quiz")).toBe(1);
    expect(incrementAttemptCount(suspend, "quiz")).toBe(2);
  });
});

describe("shuffleQuestions", () => {
  it("returns a permutation of the same length", () => {
    const items = [1, 2, 3, 4];
    const shuffled = shuffleQuestions(items);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.sort()).toEqual(items);
  });
});
