export type { NavItem } from "./client/nav.js";
export { buildNavItems, renderNav } from "./client/nav.js";
export { renderMarkdown } from "./client/lessons/markdown.js";
export { renderHtmlInteraction } from "./client/lessons/html.js";
export { loadAssessment } from "./client/assessment-loader.js";
export { renderComponentLesson } from "./client/lessons/component.js";
export { init, bootstrapClient } from "./client/app.js";
export { renderAssessment, scoreAssessmentForm as scoreAssessment } from "./quiz/index.js";

/* v8 ignore start -- entry guard: auto-bootstrap only outside test */
import { bootstrapClient } from "./client/app.js";

const isTestEnv = process.env.VITEST === "true";

if (!isTestEnv) {
  bootstrapClient();
}
/* v8 ignore end */
