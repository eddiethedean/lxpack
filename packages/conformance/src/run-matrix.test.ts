import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import { runConformanceMatrix } from "./run-matrix.js";

const REPO_ROOT = join(import.meta.dirname, "../../..");

describe("runConformanceMatrix", () => {
  beforeAll(() => {
    const client = join(REPO_ROOT, "packages/runtime/dist/client.js");
    if (!existsSync(client)) {
      execSync("pnpm --filter @lxpack/runtime build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
    const components = join(REPO_ROOT, "packages/components/dist/bundle.js");
    if (!existsSync(components)) {
      execSync("pnpm --filter @lxpack/components build", {
        cwd: REPO_ROOT,
        stdio: "pipe",
      });
    }
  });

  it("packages fixture for core export targets", async () => {
    const result = await runConformanceMatrix({
      targets: ["standalone", "scorm12"],
    });
    if (!result.ok) {
      console.error(JSON.stringify(result.results, null, 2));
    }
    expect(result.ok).toBe(true);
    expect(result.results.every((r) => r.ok)).toBe(true);
  }, 120_000);
});
