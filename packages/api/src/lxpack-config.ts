import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  assertResolvedPathContained,
  formatErrorMessage,
} from "@lxpack/validators";
import type { ExportTarget } from "@lxpack/scorm";

const EXPORT_TARGETS = new Set<ExportTarget>([
  "scorm12",
  "scorm2004",
  "standalone",
  "xapi",
  "cmi5",
]);

export interface LxpackConfig {
  exports?: { defaultTarget?: ExportTarget };
  output?: { dir?: string };
}

function parseLxpackConfig(raw: unknown): LxpackConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("lxpack.config.json must be a JSON object");
  }
  const obj = raw as Record<string, unknown>;
  const config: LxpackConfig = {};

  if (obj.exports !== undefined) {
    if (obj.exports === null || typeof obj.exports !== "object") {
      throw new Error("exports must be an object");
    }
    const exportsObj = obj.exports as Record<string, unknown>;
    if (exportsObj.defaultTarget !== undefined) {
      if (typeof exportsObj.defaultTarget !== "string") {
        throw new Error("exports.defaultTarget must be a string");
      }
      if (!EXPORT_TARGETS.has(exportsObj.defaultTarget as ExportTarget)) {
        throw new Error(`Invalid exports.defaultTarget: ${exportsObj.defaultTarget}`);
      }
      config.exports = {
        defaultTarget: exportsObj.defaultTarget as ExportTarget,
      };
    }
  }

  if (obj.output !== undefined) {
    if (obj.output === null || typeof obj.output !== "object") {
      throw new Error("output must be an object");
    }
    const outputObj = obj.output as Record<string, unknown>;
    if (outputObj.dir !== undefined) {
      if (typeof outputObj.dir !== "string") {
        throw new Error("output.dir must be a string");
      }
      config.output = { dir: outputObj.dir };
    }
  }

  return config;
}

export async function loadLxpackConfig(
  courseDir: string,
): Promise<LxpackConfig | null> {
  const configPath = join(courseDir, "lxpack.config.json");
  if (!existsSync(configPath)) return null;

  const contained = assertResolvedPathContained(courseDir, configPath);
  if (!contained.ok) {
    throw new Error(`lxpack.config.json: ${contained.message}`);
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const raw = JSON.parse(content) as unknown;
    return parseLxpackConfig(raw);
  } catch (err) {
    throw new Error(
      `Failed to load lxpack.config.json: ${formatErrorMessage(err)}`,
    );
  }
}

export function resolveDefaultExportTarget(
  config: LxpackConfig | null,
): ExportTarget {
  return config?.exports?.defaultTarget ?? "scorm12";
}

export function resolveOutputBaseDir(
  config: LxpackConfig | null,
  explicit?: string,
): string {
  return explicit ?? config?.output?.dir ?? ".lxpack";
}
