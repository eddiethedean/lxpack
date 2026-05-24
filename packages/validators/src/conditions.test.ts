import { describe, expect, it } from "vitest";
import { conditionSchema } from "./conditions.js";

describe("conditionSchema", () => {
  it("parses composite all/any conditions", () => {
    const all = conditionSchema.parse({
      all: [{ variable: { eq: ["path", "advanced"] } }],
    });
    expect("all" in all).toBe(true);

    const any = conditionSchema.parse({
      any: [{ interaction: { done: "choose_path" } }],
    });
    expect("any" in any).toBe(true);
  });
});
