export interface XapiActor {
  objectType?: "Agent";
  name?: string;
  mbox?: string;
  account?: { homePage: string; name: string };
}

export interface XapiVerb {
  id: string;
  display?: Record<string, string>;
}

export interface XapiObject {
  objectType?: "Activity" | "StatementRef";
  id: string;
  definition?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
    type?: string;
  };
}

export interface XapiResult {
  score?: { scaled?: number; raw?: number; min?: number; max?: number };
  success?: boolean;
  completion?: boolean;
  duration?: string;
  extensions?: Record<string, unknown>;
}

export interface XapiContext {
  registration?: string;
  contextActivities?: {
    parent?: XapiObject[];
    grouping?: XapiObject[];
  };
  extensions?: Record<string, unknown>;
}

export interface XapiStatement {
  id?: string;
  actor: XapiActor;
  verb: XapiVerb;
  object: XapiObject;
  result?: XapiResult;
  context?: XapiContext;
  timestamp?: string;
}
