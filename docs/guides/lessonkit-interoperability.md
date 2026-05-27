# LessonKit interoperability (LXPack v0.4)

LXPack can act as the **packaging and LMS export layer** for React-authored courses built with
LessonKit.

This guide covers the v0.4 interoperability surface:

- `type: spa` lessons (built app folders packaged as lessons)
- the parent bridge API (`window.parent.lxpackBridge.v1`)
- programmatic validate/build via `@lxpack/api`
- optional interchange metadata via `lessonkit.json`

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

If `lessonkit.json` exists at the course root, `@lxpack/api` will merge supported fields into the
validated manifest prior to build.

Today this is primarily used to provide SPA lesson metadata (id/title/path) from external tooling.

## Migration mapping (high level)

- **LessonKit React lesson** → LXPack `type: spa`
- **LessonKit markdown/content pages** → LXPack `type: markdown`
- **LessonKit embedded labs** → LXPack `type: html` (iframe) or `type: spa` (built app)

