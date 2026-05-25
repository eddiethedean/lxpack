import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const clientBundlePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../dist/client.js",
);

describe("client browser bundle", () => {
  it("does not ship unguarded process.env.VITEST (SCORM/LMS browsers)", async () => {
    const source = await readFile(clientBundlePath, "utf8");
    // Unguarded access throws ReferenceError when `process` is missing (issue #1).
    expect(source).not.toMatch(/=\s*process\.env\.VITEST\s*===/);
    expect(source).not.toMatch(/\bprocess\.env\.VITEST\b/);
  });
});
