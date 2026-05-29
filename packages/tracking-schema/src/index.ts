export const TRACK_EVENT_INTERACTION = "interaction" as const;
export const TRACK_EVENT_SIMULATION = "simulation" as const;
export const TRACK_EVENT_ASSESSMENT = "assessment" as const;

export type TrackEventType =
  | typeof TRACK_EVENT_INTERACTION
  | typeof TRACK_EVENT_SIMULATION
  | typeof TRACK_EVENT_ASSESSMENT;

/**
 * Canonical mapping from LXPack track event types to xAPI verbs.
 * Note: lesson navigation/completion are emitted by the runtime analytics reporter, not via track().
 */
export const TRACK_EVENT_XAPI_VERB: Record<TrackEventType, string> = {
  interaction: "interacted",
  simulation: "interacted",
  assessment: "answered",
};

export * from "./lessonkit-telemetry.js";

