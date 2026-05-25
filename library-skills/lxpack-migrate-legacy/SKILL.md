---
name: lxpack-migrate-legacy
description: >-
  Map Articulate Storyline, Rise, Captivate, or slide-based eLearning into LXPack
  file structure (lessons, assessments, HTML interactions). Use when migrating off
  legacy authoring tools.
license: Apache-2.0
metadata:
  lxpack-version: "0.3.3"
---

# Migrate legacy eLearning to LXPack

## Concept map

| Legacy | LXPack |
|--------|--------|
| Slide / scene | `markdown` or `component` lesson |
| HTML page (static) | `lessons/*.md` (preferred) or `interactions/` if layout must stay HTML |
| Multi-page HTML site / SCORM unpack | Restructure to `course.yaml` + lessons + interactions + assessments |
| Quiz slide / HTML quiz | `assessments/*.yaml` |
| Triggers / variables | `variables` + `flow` or HTML + `lxpack.track` |
| Simulation / hotspot | `interactions/<name>/index.html` |
| Publish | `lxpack build --target scorm12` (usually) |
| Preview | `lxpack preview` |

## Migration order

1. `lxpack init <course-name>`
2. Inventory modules → list lesson ids
3. Pilot **one module**: markdown + one quiz + optional lab
4. `lxpack validate` → `lxpack preview` → LMS staging
5. Scale remaining modules

## What to rewrite (not convert automatically)

- `.story`, `.cptx`, Rise packages — extract text/media manually or via export
- **Arbitrary HTML course folders** — no `lxpack import`; inventory pages, map to lessons/interactions, use docs prompts (inventory → file plan → multi-file migrate)
- Complex Storyline triggers — simplify to web-native HTML or `flow`
- Embedded Storyline player chrome — dropped; LXPack runtime provides navigation
- Legacy SCORM completion APIs — replace with `window.parent.lxpack.track` and YAML assessments

## Content conversion tips

- Slide bullets → `#` / `##` Markdown in `lessons/`
- Quiz banks → one YAML file per quiz; one correct choice per question
- Use **lxpack-author** for manifest edits; **lxpack-interaction** for labs

## Checklist

See `references/migration-checklist.md`.

## Validate early

Run `lxpack validate` after each module, not only at the end.
