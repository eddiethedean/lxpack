import { describe, expect, it } from "vitest";
import { TRACK_EVENT_XAPI_VERB } from "./index.js";

describe("@lxpack/tracking-schema", () => {
  it("maps track event types to xAPI verbs", () => {
    expect(TRACK_EVENT_XAPI_VERB.interaction).toBe("interacted");
    expect(TRACK_EVENT_XAPI_VERB.simulation).toBe("interacted");
    expect(TRACK_EVENT_XAPI_VERB.assessment).toBe("answered");
  });
});

