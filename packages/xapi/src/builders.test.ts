import { describe, expect, it } from "vitest";
import {
  buildAnswered,
  buildLaunched,
  buildInteracted,
  courseActivityIri,
  type XapiSessionContext,
} from "./index.js";

const ctx: XapiSessionContext = {
  courseIri: "https://example.com/courses/demo",
  courseTitle: "Demo",
  registration: "reg-1",
  actor: { name: "Test", mbox: "mailto:t@example.com" },
};

describe("builders", () => {
  it("buildLaunched targets course activity", () => {
    const s = buildLaunched(ctx);
    expect(s.verb.id).toContain("launched");
    expect(s.object.id).toBe(ctx.courseIri);
  });

  it("buildAnswered includes scaled score", () => {
    const s = buildAnswered(
      ctx,
      { id: "quiz", title: "Quiz", kind: "assessment" },
      0.8,
      true,
    );
    expect(s.verb.id).toContain("answered");
    expect(s.object.id).toBe(courseActivityIri(ctx.courseIri, "quiz"));
    expect(s.result?.score?.scaled).toBe(0.8);
    expect(s.result?.success).toBe(true);
  });

  it("buildInteracted adds simulation extension", () => {
    const s = buildInteracted(ctx, "lab", { simulation: { step: 2 } });
    expect(s.result?.extensions?.["https://lxpack.dev/xapi/extensions/simulation"]).toEqual({
      step: 2,
    });
  });
});
