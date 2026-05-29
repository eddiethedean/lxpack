# LessonKit interoperability (LXPack v0.5)

LXPack can act as the **packaging and LMS export layer** for React-authored courses built with
LessonKit.

This guide covers the interoperability surface:

- `type: spa` lessons (built app folders packaged as lessons)
- the parent bridge API (`window.parent.lxpackBridge.v1`)
- programmatic validate/build via `@lxpack/api`
- **`packageLessonkit()`** — materialize and build without hand-written `course.yaml` (v0.5.0)
- versioned interchange metadata via `lessonkit.json` (v1 schema)

## `type: spa` lessons

`type: spa` packages a folder that contains an `index.html` entrypoint (e.g. Vite build output).

Example:

```yaml
lessons:
  - id: phishing_101
    title: Phishing Awareness
    type: spa
    path: dist/lessons/phishing-101
```

## Bridge API: `window.parent.lxpackBridge.v1`

SPA lessons are rendered inside an iframe. To report progress back to the LXPack shell, call the
parent bridge:

```js
window.parent?.lxpackBridge?.v1?.completeLesson("phishing_101");
window.parent?.lxpackBridge?.v1?.submitAssessment({ id: "final_quiz", score: 0.9, passingScore: 0.7 });
window.parent?.lxpackBridge?.v1?.track({ type: "interaction", id: "clicked", data: { ok: true } });
```

Fallback (for older shells) is `window.parent.lxpack`.

## Programmatic build/validate (`@lxpack/api`)

Use the API package when integrating from another toolchain (e.g. `@lessonkit/lxpack`) and you want
typed results instead of a CLI subprocess.

```ts
import { validateCourse, buildCourse } from "@lxpack/api";

const validation = await validateCourse({ courseDir, target: "scorm2004" });
if (!validation.ok) throw new Error("invalid course");

await buildCourse({ courseDir, target: "scorm2004", output: "dist/course.zip" });
```

## Optional interchange metadata (`lessonkit.json`)

v1 interchange requires `"format": "lessonkit"` and `"version": "1"`. See [lessonkit interchange reference](../reference/lessonkit-interchange.md).

If `lessonkit.json` exists at the course root, `@lxpack/api` and the `lxpack` CLI merge supported fields into the validated manifest prior to build.

## Thin packaging without `course.yaml` (v0.5.0)

```ts
import { packageLessonkit } from "@lxpack/api";

await packageLessonkit({
  interchange: { /* v1 document */ },
  spaDirs: { lesson_id: "/abs/path/to/dist" },
  target: "scorm12",
});
```

CLI:

```bash
lxpack build --lessonkit ./lessonkit.json --spa-lesson lesson_id=/abs/path/to/dist
```

## Migration mapping (high level)

- **LessonKit React lesson** → LXPack `type: spa`
- **LessonKit markdown/content pages** → LXPack `type: markdown`
- **LessonKit embedded labs** → LXPack `type: html` (iframe) or `type: spa` (built app)

