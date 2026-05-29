# API stability (LessonKit 1.0 gate)

Targets for **v0.6.0** and the path to LessonKit **1.0.0**.

## Stable in v0.6.0

### `lxpackBridge.v1`

- `completeLesson(lessonId: string)`
- `completeCourse()` (marks all lessons complete)
- `submitAssessment({ id, score, passingScore?, maxScore? })` — scores **0–1** at the bridge
- `track?(event)` — canonical `@lxpack/tracking-schema` shapes

Types: `@lxpack/spa-bridge`

### `lessonkit.json` v1

- `format: "lessonkit"`, `version: "1"`
- Breaking changes require `version: "2"` and migration notes

### Programmatic packaging

- `packageLessonkit()` / `buildCourse()` result shapes (`ok`, `issues`, `outputPath`, `courseDir`)
- `ExportTarget`: `scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5`

### SPA lessons

- `type: spa` + folder with `index.html`

## Versioning policy

- Patch: bug fixes, docs, non-breaking warnings
- Minor: additive fields, new presets, new export options
- Major: bridge v2, interchange v2, removed exports
