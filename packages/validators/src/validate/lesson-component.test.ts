import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { validateComponentLesson } from "./lesson-component.js";

describe("validateComponentLesson", () => {
  it("accepts built-in components", () => {
    const issues = validateComponentLesson("/tmp", {
      id: "c",
      type: "component",
      component: "callout",
    });
    expect(issues).toHaveLength(0);
  });

  it("reports missing custom component override", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-"));
    await mkdir(join(dir, "components"), { recursive: true });
    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "missing-widget",
    });
    expect(issues[0]?.message).toContain("Unknown component");
  });

  it("reports when override path is a directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-dir-"));
    const compDir = join(dir, "components", "my-widget");
    await mkdir(compDir, { recursive: true });
    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "my-widget",
    });
    expect(issues[0]?.message).toContain("not a file");
  });

  it("accepts a file override", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-file-"));
    const compFile = join(dir, "components", "custom.js");
    await mkdir(join(dir, "components"), { recursive: true });
    await writeFile(compFile, "export default {}");
    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "custom.js",
    });
    expect(issues).toHaveLength(0);
  });
});
