import type { XapiVerb } from "./statement.js";

const ADL = "http://adlnet.gov/expapi/verbs";

export const VERB_LAUNCHED: XapiVerb = {
  id: `${ADL}/launched`,
  display: { "en-US": "launched" },
};

export const VERB_EXPERIENCED: XapiVerb = {
  id: `${ADL}/experienced`,
  display: { "en-US": "experienced" },
};

export const VERB_ANSWERED: XapiVerb = {
  id: `${ADL}/answered`,
  display: { "en-US": "answered" },
};

export const VERB_COMPLETED: XapiVerb = {
  id: `${ADL}/completed`,
  display: { "en-US": "completed" },
};

export const VERB_PASSED: XapiVerb = {
  id: `${ADL}/passed`,
  display: { "en-US": "passed" },
};

export const VERB_FAILED: XapiVerb = {
  id: `${ADL}/failed`,
  display: { "en-US": "failed" },
};

export const VERB_INTERACTED: XapiVerb = {
  id: `${ADL}/interacted`,
  display: { "en-US": "interacted" },
};
