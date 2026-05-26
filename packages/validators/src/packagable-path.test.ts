import { linkSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  assertPackagableFile,
  courseRelativeFromRoot,
  isLogicalPathAllowedForTarget,
  isPackagablePathAliasBlocked,
  isSensitiveCourseRel,
  normalizeLogicalCourseRel,
} from "./packagable-path.js";

describe("normalizeLogicalCourseRel", () => {
  it("normalizes separators and leading ./", () => {
    expect(normalizeLogicalCourseRel(".\\lessons\\a.md")).toBe("lessons/a.md");
  });
});

describe("isSensitiveCourseRel", () => {
  it("flags assessments, manifest, lxpack output, and dotfiles", () => {
    expect(isSensitiveCourseRel("assessments/quiz.yaml")).toBe(true);
    expect(isSensitiveCourseRel("course.yaml")).toBe(true);
    expect(isSensitiveCourseRel("lxpack.config.json")).toBe(true);
    expect(isSensitiveCourseRel(".lxpack/out.zip")).toBe(true);
    expect(isSensitiveCourseRel(".lxpack")).toBe(true);
    expect(isSensitiveCourseRel("assets/.env")).toBe(true);
    expect(isSensitiveCourseRel("lessons/intro.md")).toBe(false);
  });
});

describe("isLogicalPathAllowedForTarget", () => {
  it("allows assessment paths only under assessments/", () => {
    expect(
      isLogicalPathAllowedForTarget(
        "assessments/quiz.yaml",
        "assessments/quiz.yaml",
      ),
    ).toBe(true);
    expect(
      isLogicalPathAllowedForTarget(
        "lessons/leak.md",
        "assessments/quiz.yaml",
      ),
    ).toBe(false);
  });

  it("allows manifest paths only at matching logical paths", () => {
    expect(
      isLogicalPathAllowedForTarget("course.yaml", "course.yaml"),
    ).toBe(true);
    expect(
      isLogicalPathAllowedForTarget("lessons/x.md", "course.yaml"),
    ).toBe(false);
  });

  it("allows lxpack output only under .lxpack/", () => {
    expect(
      isLogicalPathAllowedForTarget(".lxpack/build.zip", ".lxpack/build.zip"),
    ).toBe(true);
    expect(
      isLogicalPathAllowedForTarget("lessons/x.md", ".lxpack/build.zip"),
    ).toBe(false);
  });

  it("allows dotfile targets only at the same logical path", () => {
    expect(
      isLogicalPathAllowedForTarget("assets/.env", "assets/.env"),
    ).toBe(true);
    expect(
      isLogicalPathAllowedForTarget("lessons/x.md", "assets/.env"),
    ).toBe(false);
  });
});

describe("courseRelativeFromRoot", () => {
  it("returns a relative path inside the course", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-rel-"));
    const file = join(dir, "lessons", "intro.md");
    mkdirSync(join(dir, "lessons"), { recursive: true });
    writeFileSync(file, "# Hi");
    expect(courseRelativeFromRoot(dir, file)).toBe("lessons/intro.md");
  });

  it("returns null for paths outside the course", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-rel-out-"));
    expect(courseRelativeFromRoot(dir, "/etc/hosts")).toBeNull();
  });
});

describe("assertPackagableFile", () => {
  it("accepts a normal lesson file", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-ok-"));
    mkdirSync(join(dir, "lessons"), { recursive: true });
    const file = join(dir, "lessons", "intro.md");
    writeFileSync(file, "# Hi");
    const result = assertPackagableFile(dir, file, "lessons/intro.md");
    expect(result.ok).toBe(true);
  });

  it("rejects symlinks", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-sym-"));
    mkdirSync(join(dir, "lessons"), { recursive: true });
    mkdirSync(join(dir, "assessments"), { recursive: true });
    writeFileSync(join(dir, "assessments", "quiz.yaml"), "id: q\nquestions: []\n");
    const link = join(dir, "lessons", "leak.md");
    symlinkSync(join(dir, "assessments", "quiz.yaml"), link);
    const result = assertPackagableFile(dir, link, "lessons/leak.md");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Symlink not allowed/);
    }
  });

  it("rejects hard links", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-hl-"));
    mkdirSync(join(dir, "lessons"), { recursive: true });
    mkdirSync(join(dir, "assessments"), { recursive: true });
    writeFileSync(join(dir, "assessments", "quiz.yaml"), "id: q\nquestions: []\n");
    const link = join(dir, "lessons", "leak.md");
    linkSync(join(dir, "assessments", "quiz.yaml"), link);
    const result = assertPackagableFile(dir, link, "lessons/leak.md");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Hard link not allowed/);
    }
  });

  it("rejects alias to assessments without symlink", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-alias-"));
    mkdirSync(join(dir, "lessons"), { recursive: true });
    mkdirSync(join(dir, "assessments"), { recursive: true });
    const quiz = join(dir, "assessments", "quiz.yaml");
    writeFileSync(quiz, "id: q\nquestions: []\n");
    const result = assertPackagableFile(dir, quiz, "lessons/wrong.md");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/restricted location/);
    }
  });

  it("rejects missing paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-miss-"));
    const result = assertPackagableFile(
      dir,
      join(dir, "missing.md"),
      "lessons/x.md",
    );
    expect(result.ok).toBe(false);
  });
});

describe("isPackagablePathAliasBlocked", () => {
  it("blocks in-tree assessment aliases", () => {
    const dir = mkdtempSync(join(tmpdir(), "lxpack-block-"));
    mkdirSync(join(dir, "lessons"), { recursive: true });
    mkdirSync(join(dir, "assessments"), { recursive: true });
    const quiz = join(dir, "assessments", "quiz.yaml");
    writeFileSync(quiz, "id: q\nquestions: []\n");
    expect(
      isPackagablePathAliasBlocked(dir, quiz, "lessons/leak.md"),
    ).toBe(true);
  });
});
