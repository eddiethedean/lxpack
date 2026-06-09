import { describe, expect, it } from "vitest";
import {
  findHtmlSpaLessonByInteractionId,
  pushPendingInteractionLesson,
  removePendingInteractionLesson,
  resolveInteractionLessonForCompletion,
} from "./interaction-lesson.js";
import type { NavItem } from "./types.js";

const navItems: NavItem[] = [
  {
    id: "welcome",
    kind: "lesson",
    title: "Welcome",
    lesson: { id: "welcome", type: "markdown", file: "lessons/welcome.md" },
  },
  {
    id: "phishing-lab",
    kind: "lesson",
    title: "Phishing Lab",
    lesson: { id: "phishing-lab", type: "html", path: "interactions/lab" },
  },
  {
    id: "spa1",
    kind: "lesson",
    title: "SPA",
    lesson: { id: "spa1", type: "spa", path: "spa/app" },
  },
  {
    id: "final_quiz",
    kind: "assessment",
    title: "Quiz",
    file: "assessments/final.yaml",
  },
];

describe("findHtmlSpaLessonByInteractionId", () => {
  it("returns html lesson when interaction id matches lesson id", () => {
    const item = findHtmlSpaLessonByInteractionId(navItems, "phishing-lab");
    expect(item?.id).toBe("phishing-lab");
    expect(item?.lesson.type).toBe("html");
  });

  it("returns spa lesson when interaction id matches lesson id", () => {
    const item = findHtmlSpaLessonByInteractionId(navItems, "spa1");
    expect(item?.lesson.type).toBe("spa");
  });

  it("returns undefined for markdown lessons and assessments", () => {
    expect(findHtmlSpaLessonByInteractionId(navItems, "welcome")).toBeUndefined();
    expect(findHtmlSpaLessonByInteractionId(navItems, "final_quiz")).toBeUndefined();
    expect(findHtmlSpaLessonByInteractionId(navItems, "unknown")).toBeUndefined();
  });
});

describe("resolveInteractionLessonForCompletion", () => {
  it("prefers lesson id match over current page and pending stack", () => {
    expect(
      resolveInteractionLessonForCompletion(
        navItems,
        0,
        "phishing-lab",
        ["spa1"],
      ),
    ).toBe("phishing-lab");
  });

  it("uses current html/spa lesson when track id does not match lesson id", () => {
    expect(
      resolveInteractionLessonForCompletion(
        navItems,
        1,
        "phishing_detected",
        [],
      ),
    ).toBe("phishing-lab");
  });

  it("falls back to most recent pending lesson when navigated away", () => {
    expect(
      resolveInteractionLessonForCompletion(
        navItems,
        0,
        "phishing_detected",
        ["phishing-lab"],
      ),
    ).toBe("phishing-lab");
  });

  it("returns undefined when no lesson can be resolved", () => {
    expect(
      resolveInteractionLessonForCompletion(navItems, 0, "unknown", []),
    ).toBeUndefined();
  });
});

describe("pending interaction lesson stack", () => {
  it("skips duplicate consecutive push", () => {
    const stack: string[] = [];
    pushPendingInteractionLesson(stack, "phishing-lab");
    pushPendingInteractionLesson(stack, "phishing-lab");
    expect(stack).toEqual(["phishing-lab"]);
  });

  it("removes lesson id after completion", () => {
    const stack = ["phishing-lab", "spa1"];
    removePendingInteractionLesson(stack, "phishing-lab");
    expect(stack).toEqual(["spa1"]);
  });
});
