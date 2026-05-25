# Glossary

Plain-language definitions for LXPack and LMS terms used in this documentation.

## Course and files

| Term | Meaning |
|------|---------|
| **Course** | Your whole learning experience — all lessons, activities, and quizzes together. |
| **Course folder** | Directory on disk that contains `course.yaml` and your content files. |
| **`course.yaml`** | The “settings and table of contents” file. Lists every lesson and quiz and optional rules (branching, tracking). |
| **Lesson** | One step in the course — usually a Markdown page, an HTML activity, or a built-in widget. |
| **Interaction / lab** | A web page activity in `interactions/<name>/index.html` (for example a click-to-report phishing exercise). |
| **Assessment / quiz** | Questions in `assessments/*.yaml`. Not shipped as a separate file to learners; baked into the export at build time. |
| **Manifest** | Same idea as `course.yaml` — the authoritative list of what is in the course. |

## Commands

| Term | Meaning |
|------|---------|
| **`lxpack init`** | Create a new empty course project with sample files. |
| **`lxpack preview`** | Local website to click through the course while authoring. |
| **`lxpack validate`** | Check structure, missing files, and export rules. |
| **`lxpack build`** | Produce SCORM, xAPI, cmi5, or standalone output for deployment. |
| **CLI** | Command-line interface — the `lxpack` commands you run in Terminal. |

## Lesson types

| Term | Meaning |
|------|---------|
| **Markdown lesson** | Text content in `lessons/*.md` — headings, lists, links. |
| **HTML lesson** | Custom activity page under `interactions/`. |
| **Component lesson** | Built-in widget (`callout`, `checklist`, `image-card`) without writing HTML. |

## LMS and standards

| Term | Meaning |
|------|---------|
| **LMS** | Learning Management System — where learners launch courses (Moodle, Cornerstone, etc.). |
| **SCORM** | Common packaging standard. LXPack supports **SCORM 1.2** (single package) and **SCORM 2004** (multi-activity). |
| **SCO** | Sharable Content Object — one launchable unit inside a SCORM package. |
| **xAPI** | Experience API — sends learning statements to an **LRS** (Learning Record Store). |
| **cmi5** | Profile that wraps xAPI for LMS launch; uses `cmi5.xml` plus xAPI statements. |
| **Activity IRI** | Stable HTTPS URL that identifies your course for xAPI/cmi5 (set in `tracking.xapi`). |
| **Completion threshold** | Fraction of lessons/quiz requirements to mark the course complete (for example `0.9` = 90%). |

## Authoring concepts

| Term | Meaning |
|------|---------|
| **Variable** | Named value in `course.yaml` (for example `track: basic`) used for branching. |
| **Flow** | Rules that jump learners to different lessons based on variables, quiz pass, or activity completion. |
| **Branching** | Non-linear paths — different learners see different lessons. |
| **`lxpack.config.json`** | Optional project settings: default export format, preview SCORM simulation, output folder. |
| **`.lxpack/`** | Generated build output (ZIP files). Safe to delete and rebuild. |

## AI authoring

| Term | Meaning |
|------|---------|
| **Claude Design** | Anthropic tool for visual/storyboard-oriented design; pairs with editing files in LXPack. |
| **Claude Code** | Agentic coding in Cursor or similar IDE — optional developer track. |

## Security (author-facing)

| Term | Meaning |
|------|---------|
| **Author YAML** | Quiz files you keep in the repo for editing. |
| **Embedded bundle** | At build time, quiz data is embedded in HTML — learners do not download `assessments/*.yaml`. |

See also [Course structure](../guides/course-structure.md) and [Reference: course.yaml](../reference/course-yaml.md).
