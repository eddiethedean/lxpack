# SCORM layout recipes for SPA courses

For **LessonKit 1.0** React projects, prefer `lessonkit package --target scorm12` (or `scorm2004`) after `lessonkit build` — see [LessonKit packaging](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html). The recipes below also apply to **`lxpack build --lessonkit`** and `@lxpack/api` interchange packaging.

## Recipe A — Single SCO SPA (default)

One `type: spa` lesson; in-app routing inside the SPA. SCORM 1.2 and single-SCO SCORM 2004 launches use one package entry.

- **LessonKit:** `single-spa` layout
- **Interchange:** one lesson in `lessonkit.json`
- **SCORM layout:** `inferScormSpaLayout()` returns `single-sco-spa` (one lesson); packaging uses `scorm12` / single-SCO targets

```bash
lxpack build --lessonkit ./lessonkit.json --spa-dist ./dist --target scorm12
```

## Recipe B — Multi SCO SPA

One SPA build folder per lesson id; SCORM 2004 can emit one SCO per lesson.

- **LessonKit:** `per-lesson-spa`
- **Interchange:** multiple lessons with **distinct** `path` / dist folders
- **SCORM layout:** `inferScormSpaLayout()` returns `multi-sco-spa` (multiple lessons); use `--target scorm2004` for per-activity SCOs

```bash
lxpack build --lessonkit ./lessonkit.json \
  --spa-lesson intro=/abs/dist/intro \
  --spa-lesson quiz=/abs/dist/quiz \
  --target scorm2004
```

LXPack warns when multiple lessons share the same `path` (multi-SCO needs separate folders).

## See also

- [LessonKit & React hub](../guides/lessonkit/index.md)
- [Export to LMS](export-to-lms.md)
- [lessonkit interchange](../reference/lessonkit-interchange.md)
