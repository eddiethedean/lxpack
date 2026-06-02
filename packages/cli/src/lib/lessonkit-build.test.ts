import { describe, expect, it } from "vitest";
import {
  buildSpaDirsFromInterchange,
  loadLessonkitInterchangeFile,
  parseSpaLessonOption,
  resolveLessonkitConfigDir,
  validateSpaDirsForInterchange,
} from "./lessonkit-build.js";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("lessonkit-build helpers", () => {
  it("resolveLessonkitConfigDir returns parent of interchange file", () => {
    expect(resolveLessonkitConfigDir("/proj/sub/lessonkit.json")).toBe(
      "/proj/sub",
    );
  });

  it("parseSpaLessonOption splits id and path", () => {
    expect(parseSpaLessonOption("lesson_a=/tmp/dist")).toEqual({
      id: "lesson_a",
      path: expect.stringContaining("/tmp/dist"),
    });
  });

  it("parseSpaLessonOption rejects invalid values", () => {
    expect(() => parseSpaLessonOption("noseparator")).toThrow(/Invalid/);
    expect(() => parseSpaLessonOption("=onlypath")).toThrow(/Invalid/);
    expect(() => parseSpaLessonOption("idonly=")).toThrow(/Invalid/);
    expect(() => parseSpaLessonOption("spa1=dist/spa1")).toThrow(/absolute/);
  });

  it("loadLessonkitInterchangeFile reports schema validation errors", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-lk-schema-"));
    const path = join(dir, "invalid.json");
    await writeFile(
      path,
      JSON.stringify({ format: "lessonkit", version: "1", lessons: [] }),
    );
    const result = await loadLessonkitInterchangeFile(path);
    expect(result.ok).toBe(false);
    await rm(dir, { recursive: true, force: true });
  });

  it("loadLessonkitInterchangeFile reports missing file and bad JSON", async () => {
    const missing = await loadLessonkitInterchangeFile("/no/such/lessonkit.json");
    expect(missing.ok).toBe(false);

    const dir = await mkdtemp(join(tmpdir(), "lxpack-lk-bad-"));
    const path = join(dir, "bad.json");
    await writeFile(path, "not json");
    const badJson = await loadLessonkitInterchangeFile(path);
    expect(badJson.ok).toBe(false);
    await rm(dir, { recursive: true, force: true });
  });

  it("buildSpaDirsFromInterchange merges explicit spa-lesson paths", () => {
    const interchange = {
      format: "lessonkit" as const,
      version: "1" as const,
      lessons: [
        { id: "a", type: "spa" as const, path: "dist/a" },
        { id: "b", type: "spa" as const, path: "dist/b" },
      ],
    };
    const dirs = buildSpaDirsFromInterchange(
      interchange,
      [
        { id: "a", path: "/spa/a" },
        { id: "b", path: "/spa/b" },
      ],
      undefined,
    );
    expect(dirs).toEqual({ a: "/spa/a", b: "/spa/b" });
  });

  it("loadLessonkitInterchangeFile validates JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-lk-load-"));
    const path = join(dir, "lessonkit.json");
    await writeFile(
      path,
      JSON.stringify({
        format: "lessonkit",
        version: "1",
        lessons: [{ id: "spa1", type: "spa", path: "dist/spa1" }],
      }),
    );

    const loaded = await loadLessonkitInterchangeFile(path);
    expect(loaded.ok).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it("validateSpaDirsForInterchange rejects unknown and missing lesson ids", () => {
    const interchange = {
      format: "lessonkit" as const,
      version: "1" as const,
      lessons: [{ id: "spa1", type: "spa" as const, path: "dist/spa1" }],
    };
    expect(
      validateSpaDirsForInterchange(interchange, { unknown: "/tmp/x" }),
    ).toMatch(/Unknown SPA lesson/);
    expect(validateSpaDirsForInterchange(interchange, {})).toMatch(/Missing/);
    expect(validateSpaDirsForInterchange(interchange, { spa1: "/tmp/x" })).toBeNull();
  });

  it("buildSpaDirsFromInterchange maps spa-dist for single lesson", () => {
    const interchange = {
      format: "lessonkit" as const,
      version: "1" as const,
      lessons: [{ id: "only", type: "spa" as const, path: "dist/only" }],
    };
    const dirs = buildSpaDirsFromInterchange(
      interchange,
      [],
      "/abs/dist",
    );
    expect(dirs.only).toContain("/abs/dist");
  });
});
