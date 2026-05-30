# API stability (LessonKit 1.0)

Targets for **LXPack v0.6.3** interoperability with **LessonKit 1.0.0** ([github.com/eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit)).

## Stable in v0.6.3

### `lxpackBridge.v1`

- `completeLesson(lessonId: string)`
- `completeCourse()` — marks in-scope lessons complete, passes assessments at their thresholds, and sets `interaction_*` suspend keys for html/spa lessons (respects SCORM 2004 per-SCO launch scope)
- `submitAssessment({ id, score, passingScore?, maxScore?, passed? })` — scores are **0–1** when `maxScore` is omitted; when `maxScore` is set, `score` / `passingScore` are raw points if **> 1**, otherwise treated as already scaled **0–1**
- `track?(event)` — canonical `@lxpack/tracking-schema` shapes

Types: `@lxpack/spa-bridge`

### `lessonkit.json` v1

- `format: "lessonkit"`, `version: "1"`
- Breaking changes require `version: "2"` and migration notes

### Programmatic packaging

- `packageLessonkit()` / `buildCourse()` result shapes (`ok`, `issues`, `outputPath`, `courseDir`)
- `packageLessonkit({ configDir })` resolves `target` and `outputBaseDir` from `lxpack.config.json` when omitted (parity with CLI `--lessonkit`)
- `ExportTarget`: `scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5`

### SPA lessons

- `type: spa` + folder with `index.html`

## Versioning policy

- Patch: bug fixes, docs, non-breaking warnings
- Minor: additive fields, new presets, new export options
- Major: bridge v2, interchange v2, removed exports
