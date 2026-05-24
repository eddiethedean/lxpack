import { stringify as stringifyYaml } from "yaml";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export {
  findCourseDir,
  loadCourseManifest,
} from "./lib/course-discovery.js";
export {
  getRuntimeAssetsDir,
  getEmbeddedStyles,
  loadRuntimeStyles,
  readRuntimeBundle,
  readComponentsBundle,
} from "./lib/bundle-io.js";
export {
  loadLxpackConfig,
  resolvePathInCwd,
  resolveOutputDir,
  type LxpackConfig,
} from "./lib/lxpack-config.js";
export { escapeHtml } from "./lib/html.js";

export function formatCourseTitleForYaml(title: string): string {
  const doc = { title, version: "1.0.0" };
  const yaml = stringifyYaml(doc);
  const titleLine = yaml.split("\n").find((l) => l.startsWith("title:"));
  if (!titleLine) {
    return JSON.stringify(title);
  }
  return titleLine.replace(/^title:\s*/, "");
}

export function getCliVersion(): string {
  const pkg = require("../package.json") as { version: string };
  return pkg.version;
}
