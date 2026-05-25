import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import { fixturePath } from "../../../test/helpers/paths.js";
import { loadManifest, validateCourse } from "./validate.js";

describe("loadManifest", () => {
  it("returns error when course.yaml is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-empty-"));
    const result = await loadManifest(dir);
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result[0]?.path).toBe("course.yaml");
      expect(result[0]?.severity).toBe("error");
    }
  });

  it("returns error for invalid YAML structure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-bad-"));
    await writeFile(
      join(dir, "course.yaml"),
      "title: ''\nversion: 1.0.0\nlessons: []\n",
    );
    const result = await loadManifest(dir);
    expect(Array.isArray(result)).toBe(true);
  });

  it("loads a valid fixture manifest", async () => {
    const result = await loadManifest(fixturePath("minimal-valid"));
    expect(Array.isArray(result)).toBe(false);
    if (!Array.isArray(result)) {
      expect(result.manifest.title).toBe("Minimal Valid Course");
      expect(result.manifest.lessons).toHaveLength(2);
    }
  });
});

describe("validateCourse", () => {
  it("passes for a complete valid fixture course", async () => {
    const result = await validateCourse(fixturePath("minimal-valid"));
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.manifest?.lessons).toHaveLength(2);
  });

  it("reports missing markdown lesson files", async () => {
    const result = await validateCourse(fixturePath("missing-markdown"));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("not found"))).toBe(
      true,
    );
  });

  it("reports missing HTML interaction index.html", async () => {
    const result = await validateCourse(fixturePath("missing-html"));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("index.html")),
    ).toBe(true);
  });

  it("reports duplicate lesson IDs", async () => {
    const result = await validateCourse(fixturePath("duplicate-lessons"));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("Duplicate lesson ID:")),
    ).toBe(true);
  });

  it("reports invalid assessment schema", async () => {
    const result = await validateCourse(fixturePath("bad-assessment"));
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("fails when manifest schema is invalid", async () => {
    const result = await validateCourse(fixturePath("invalid-manifest"));
    expect(result.valid).toBe(false);
  });

  it("flags html lessons without path property", async () => {
    const result = await validateCourse(fixturePath("html-no-path"));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.message.includes("path") ||
          i.message.includes("Required") ||
          i.path.includes("lessons"),
      ),
    ).toBe(true);
  });

  it("reports missing assessment files", async () => {
    const result = await validateCourse(fixturePath("missing-assessment-file"));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("Assessment file not found")),
    ).toBe(true);
  });

  it("reports YAML parse errors in course.yaml", async () => {
    const result = await loadManifest(fixturePath("invalid-yaml"));
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result[0]?.message).toMatch(/Failed to parse YAML/i);
    }
  });

  it("reports assessment read failures when file is unreadable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-assess-read-"));
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
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons", "intro.md"), "# I");
    await mkdir(join(dir, "assessments", "quiz.yaml"), { recursive: true });

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("Assessment path is not a file")),
    ).toBe(true);
  });

  it("flags markdown lessons without file property", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-nofile-"));
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: intro
    type: markdown
`,
    );
    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.message.includes("file") ||
          i.message.includes("Required") ||
          i.path.includes("lessons"),
      ),
    ).toBe(true);
  });

  it("rejects lesson and assessment id collision", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lxpack-id-collision-"));
    await mkdir(join(dir, "lessons"), { recursive: true });
    await writeFile(join(dir, "lessons/intro.md"), "# Hi");
    await writeFile(
      join(dir, "course.yaml"),
      `title: T
version: 1.0.0
lessons:
  - id: quiz
    type: markdown
    file: lessons/intro.md
assessments:
  - id: quiz
    file: assessments/quiz.yaml
`,
    );
    await mkdir(join(dir, "assessments"), { recursive: true });
    await writeFile(
      join(dir, "assessments/quiz.yaml"),
      `id: quiz
passingScore: 0.5
questions:
  - id: q1
    prompt: P
    choices:
      - id: a
        text: A
        correct: true
`,
    );

    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.message.includes("conflicts with an assessment")),
    ).toBe(true);
  });

  it("rejects flow cycles", async () => {
    const dir = fixturePath("flow-cycle");
    const result = await validateCourse(dir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Flow cycle"))).toBe(true);
  });

  it("requires xAPI IRI when exportTarget is xapi", async () => {
    const result = await validateCourse(fixturePath("missing-xapi-iri"), {
      exportTarget: "xapi",
    });
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.severity === "error" && i.path.includes("xapi")),
    ).toBe(true);
  });

  it("passes xapi-valid fixture with exportTarget xapi", async () => {
    const result = await validateCourse(fixturePath("xapi-valid"), {
      exportTarget: "xapi",
    });
    expect(result.valid).toBe(true);
  });

  it("warns about cmi5 fetch limitation when exportTarget is cmi5", async () => {
    const result = await validateCourse(fixturePath("xapi-valid"), {
      exportTarget: "cmi5",
    });
    expect(
      result.issues.some(
        (i) =>
          i.severity === "warning" && i.message.toLowerCase().includes("fetch"),
      ),
    ).toBe(true);
  });
});
