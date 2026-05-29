---
name: lxpack-author
description: >-
  Author and fix LXPack v0.5.0 courses — course.yaml manifest, markdown lessons,
  SPA lessons, assessment YAML, variables/flow branching. Run lxpack validate and
  preview. Use when the workspace contains course.yaml or the user mentions lxpack,
  SCORM export, LessonKit, or learning experience authoring.
license: Apache-2.0
metadata:
  lxpack-version: "0.5.0"
  docs: https://lxpack.readthedocs.io/en/latest/
---

# LXPack course authoring

You help edit **LXPack v0.5.0** course projects. A course is a folder with `course.yaml` at the root (or a LessonKit interchange built via `lxpack build --lessonkit`).

## Before you edit

1. Confirm `course.yaml` exists (walk up from cwd if needed).
2. After structural changes, run `lxpack validate` (or `bash library-skills/lxpack-author/scripts/validate.sh` from repo).
3. Do **not** invent CLI subcommands beyond: `init`, `preview`, `validate`, `build` with `--target scorm12|scorm2004|standalone|xapi|cmi5` (`repair` is not implemented).

## Project layout

```text
course-root/
  course.yaml
  lxpack.config.json    # optional
  lessonkit.json        # optional SPA metadata (merged at validate/build)
  lessons/*.md
  interactions/<id>/index.html
  spa/<lesson>/index.html   # optional built SPA lessons
  assessments/*.yaml
  assets/
  components/           # optional widget overrides
  .lxpack/              # build output — do not hand-edit
```

## course.yaml rules

- `lessons[]`: each needs unique `id` matching `^[a-zA-Z][a-zA-Z0-9_-]*$`
- `markdown`: `file: lessons/foo.md`
- `html`: `path: interactions/foo` (folder with index.html)
- `spa`: `path: dist/lessons/foo` or `spa/lessons/foo` (folder with index.html); iframe calls `window.parent.lxpackBridge.v1`
- `component`: `component: callout|checklist|image-card` plus optional `props`
- `assessments[]`: `{ id, file: assessments/quiz.yaml }` — author YAML is **not** shipped to learners; embedded at build
- `variables` / `flow`: optional branching — see references/branching.md when user asks for paths or remediation
- `tracking.xapi.activityIri`: required HTTPS IRI for `build --target xapi|cmi5`

Deep manifest reference: read `references/manifest.md` only when editing manifest shape or flow.

## LessonKit / programmatic API

- Optional `lessonkit.json` at course root merges SPA lesson metadata before `lxpack validate` / `build` (same as `@lxpack/api`).
- For CI integrations, prefer `@lxpack/api` (`validateCourse`, `buildCourse`) over shelling to the CLI.
- Guide: https://lxpack.readthedocs.io/en/latest/guides/lessonkit-interoperability/

## Assessments

- MCQ only; **exactly one** `correct: true` per question
- `passingScore` 0–1 (0.7 = 70%)
- Optional: `maxAttempts`, `shuffleChoices`, `showFeedback: immediate|end|never`

Details: `references/assessments.md`

## Workflow you must follow

1. Read `course.yaml` and affected files.
2. Make minimal, correct edits (YAML: spaces not tabs).
3. Run `lxpack validate` (add `--target xapi` if they export xAPI/cmi5).
4. Report errors in plain language; fix and re-validate until clean.
5. Suggest `lxpack preview` before `lxpack build`.

## HTML interactions

If the task is a click lab or simulation page, switch mentally to **lxpack-interaction** skill (or read `references/interactions.md`).

## Export

If the task is LMS packaging only, use **lxpack-export** skill or `references/export-targets.md`.

## Legacy migration

Storyline/Rise mapping: **lxpack-migrate-legacy** skill.

## Do not

- Invent CLI commands that do not exist (`repair`, etc.)
- Fetch `assessments/*.yaml` from learner runtime in custom HTML or SPA iframes
- Call `window.lxpack` from inside SPA iframes — use `window.parent.lxpackBridge.v1`
- Use paths outside the course directory (`../` escapes are rejected)
