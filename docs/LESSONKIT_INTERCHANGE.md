LXPack owns the **LessonKit interchange** schema used by [`@lessonkit/lxpack`](https://github.com/eddiethedean/lessonkit/tree/main/packages/lxpack), `@lxpack/api`, and the `lxpack` CLI.

**LessonKit 1.0** project manifests use the same metadata with `schemaVersion: 1` at the repo root; `@lessonkit/lxpack` converts descriptors and manifests into the LXPack interchange shape below. See [LessonKit CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html).

## File names

- `lessonkit.json` (preferred)
- `lxpack.import.json` (alias)

Both are merged at `lxpack validate` / `lxpack build` when a `course.yaml` exists, or used alone for **interchange-only** projects.

## Required shape

```json
{
  "format": "lessonkit",
  "version": "1",
  "course": {
    "id": "my-course",
    "title": "My Course"
  },
  "lessons": [
    {
      "id": "intro_spa",
      "type": "spa",
      "path": "dist/intro",
      "title": "Introduction"
    }
  ],
  "assessments": [],
  "tracking": {
    "completion": { "threshold": 0.9 }
  },
  "runtime": {
    "theme": "modern",
    "cssVariables": {
      "--lk-color-primary": "#2563eb"
    }
  }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `format` | yes | Must be `"lessonkit"` |
| `version` | yes | Must be `"1"` |
| `lessons` | yes | At least one SPA lesson; each needs `path` or `build.outputDir` |
| `course` | no | `title` becomes manifest title |
| `assessments` | no | Full MCQ objects; use with `buildCourse({ assessments })` or `packageLessonkit` without on-disk YAML |
| `tracking` | no | `completion.threshold` (0–1); optional `xapi.activityIri` (https) for xAPI/cmi5 |
| `runtime` | no | `theme`, `cssVariables`, `themePreset` (`lessonkit:default`, `lessonkit:brand`) |

## Programmatic packaging

Use `packageLessonkit()` when you should not hand-write `course.yaml`:

```ts
import { packageLessonkit } from "@lxpack/api";

const result = await packageLessonkit({
  interchange: { /* v1 document */ },
  spaDirs: { intro_spa: "/abs/path/to/dist" },
  target: "scorm12",
  assessments: [/* optional injected quizzes */],
});
```

LXPack materializes a staging course directory, writes `course.yaml`, copies SPA folders with path containment, then runs the normal build pipeline.

## CLI

```bash
lxpack build --lessonkit ./lessonkit.json \
  --spa-lesson intro_spa=/abs/path/to/dist \
  --target scorm12
```

For a single SPA lesson, `--spa-dist /abs/path/to/dist` is shorthand.

## Schema module

TypeScript types and Zod validation live in `@lxpack/validators`:

- `lessonkitInterchangeSchema`
- `parseLessonkitInterchange()`
- `interchangeToManifest()`
- `materializeLessonkitProject()`

## Related

- [LessonKit interoperability](lessonkit-interoperability.md)
- [LessonKit and LXPack packages](lessonkit-packages.md)
- [LessonKit packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html)
- [LXPack upgrades](lxpack-upgrades.md)
