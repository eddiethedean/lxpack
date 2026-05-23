import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import {
  resolveCoursePath,
  validateCourse,
} from "./validate.js";

describe("resolveCoursePath", () => {
  it("rejects absolute paths", () => {
    const result = resolveCoursePath("/tmp/course", "/etc/passwd");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Absolute paths/);
    }
  });

  it("rejects path traversal", () => {
    const result = resolveCoursePath("/tmp/course", "../../outside.md");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/escapes course directory/);
    }
  });

  it("rejects Windows-style absolute paths", () => {
    const result = resolveCoursePath("/tmp/course", "C:\\outside.md");
    expect(result.ok).toBe(false);
  });

  it("accepts paths when courseDir has a trailing separator", () => {
    const result = resolveCoursePath("/tmp/course/", "lessons/intro.md");
    expect(result.ok).toBe(true);
  });
});

describe("validateCourse security and edge cases", () => {
  it("rejects markdown lesson paths that escape the course directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-traversal-"));
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: ../outside.md
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("escapes"))).toBe(true);
  });

  it("rejects markdown paths that are directories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-dir-md-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("not a file"))).toBe(
      true,
    );
  });

  it("rejects html interaction paths that are files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-file-html-"));
    await mkdir(join(dir, "interactions"), { recursive: true });
    await writeFile(join(dir, "interactions", "lab"), "not html dir");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: lab
    type: html
    path: interactions/lab
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("not a directory")),
    ).toBe(true);
  });

  it("reports duplicate assessment IDs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-dup-assess-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/a.yaml
  - id: quiz
    file: assessments/b.yaml
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("Duplicate assessment ID")),
    ).toBe(true);
  });

  it("reports assessment file id mismatches", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-assess-id-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await mkdir(join(dir, "assessments"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await writeFile(
      join(dir, "assessments", "quiz.yaml"),
      `id: other
questions:
  - id: q1
    prompt: "?"
    choices:
      - id: a
        text: A
        correct: true
`,
    );
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("does not match manifest ref id")),
    ).toBe(true);
  });

  it("reports assessment path traversal", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-assess-path-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: ../outside.yaml
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path.includes("assessments.quiz"))).toBe(
      true,
    );
  });

  it("rejects html lesson paths that escape the course directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-html-traversal-"));
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: lab
    type: html
    path: ../outside
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.path === "lessons.lab.path"),
    ).toBe(true);
  });

  it("reports missing html interaction directories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-missing-html-dir-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: lab
    type: html
    path: interactions/missing
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("directory not found")),
    ).toBe(true);
  });

  it("reports when index.html is not a file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-bad-index-"));
    await mkdir(join(dir, "interactions", "lab", "index.html"), {
      recursive: true,
    });
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: lab
    type: html
    path: interactions/lab
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("index.html is not a file")),
    ).toBe(true);
  });

  it("reports invalid assessment schema with root issues", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-bad-assess-schema-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await mkdir(join(dir, "assessments"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await writeFile(join(dir, "assessments", "quiz.yaml"), "not-an-object");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path.includes("quiz.yaml:root"))).toBe(
      true,
    );
  });

  it("passes minimal-valid fixture", async () => {
    const result = await validateCourse(fixturePath("minimal-valid"));
    expect(result.valid).toBe(true);
  });
});
