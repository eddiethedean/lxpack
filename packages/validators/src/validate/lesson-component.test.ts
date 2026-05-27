import { link, mkdir, symlink, writeFile } from "node:fs/promises";
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

  it("errors when override path escapes the course", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-escape-"));
    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "../escape.js",
    });
    expect(issues.some((i) => i.severity === "error")).toBe(true);
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

  it("errors when override is a symlink", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-symlink-"));
    await mkdir(join(dir, "components"), { recursive: true });
    const target = join(dir, "target.js");
    await writeFile(target, "export default {}");
    await symlink(target, join(dir, "components", "custom.js"));

    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "custom.js",
    });
    expect(issues[0]?.message).toContain("Symlink not allowed");
  });

  it("errors when override is a hard link", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-comp-hardlink-"));
    await mkdir(join(dir, "components"), { recursive: true });
    const original = join(dir, "components", "orig.js");
    await writeFile(original, "export default {}");
    await link(original, join(dir, "components", "hard.js"));

    const issues = validateComponentLesson(dir, {
      id: "c",
      type: "component",
      component: "hard.js",
    });
    expect(issues[0]?.message).toContain("Hard link not allowed");
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
