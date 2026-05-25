import type { XapiActor } from "./statement.js";

export interface LaunchParams {
  endpoint?: string;
  auth?: string;
  actor?: XapiActor;
  registration?: string;
  activityId?: string;
  fetch?: string;
}

function decodeActorParam(raw: string): XapiActor | undefined {
  try {
    const json = decodeURIComponent(raw);
    const parsed = JSON.parse(json) as XapiActor;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    try {
      const decoded = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
      const parsed = JSON.parse(decoded) as XapiActor;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function parseLaunchParams(
  search: string,
  hash = "",
): LaunchParams {
  const params = new URLSearchParams(search || hash.replace(/^#/, ""));
  const endpoint = params.get("endpoint") ?? params.get("fetch") ?? undefined;
  const auth = params.get("auth") ?? undefined;
  const registration = params.get("registration") ?? undefined;
  const activityId = params.get("activityId") ?? undefined;
  const fetch = params.get("fetch") ?? undefined;

  let actor: XapiActor | undefined;
  const actorRaw = params.get("actor");
  if (actorRaw) {
    actor = decodeActorParam(actorRaw);
  }

  return {
    endpoint: endpoint ?? undefined,
    auth: auth ?? undefined,
    actor,
    registration: registration ?? undefined,
    activityId: activityId ?? undefined,
    fetch: fetch ?? undefined,
  };
}

export function parseLaunchParamsFromWindow(): LaunchParams {
  const loc = (globalThis as { location?: { search: string; hash: string } })
    .location;
  if (!loc) return {};
  return parseLaunchParams(loc.search, loc.hash);
}

export function defaultPreviewActor(): XapiActor {
  return {
    objectType: "Agent",
    name: "LXPack Preview Learner",
    mbox: "mailto:preview@lxpack.local",
  };
}
