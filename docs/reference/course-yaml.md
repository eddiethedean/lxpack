# course.yaml reference

--8<-- "copy-tip.md"

`course.yaml` is the **course manifest** — metadata, lesson list, quizzes, optional branching, and tracking.

## Minimal example

```yaml
title: Security Awareness
version: 1.0.0
description: Annual security training

runtime:
  theme: modern

tracking:
  completion:
    threshold: 0.9

lessons:
  - id: welcome
    title: Welcome
    type: markdown
    file: lessons/welcome.md

  - id: phishing_lab
    title: Phishing lab
    type: html
    path: interactions/phishing-lab

assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

## Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Display title |
| `version` | Yes | Semver string for your records |
| `description` | No | Short summary |
| `runtime.theme` | No | CSS theme class on player (`modern`, etc.) |
| `variables` | No | Named values for branching |
| `flow` | No | Branching rules |
| `lessons` | Yes | Ordered lesson list |
| `assessments` | No | Quiz file references |
| `tracking` | No | Completion and optional xAPI |

## Lesson entry

| `type` | Required fields |
|--------|-----------------|
| `markdown` | `file:` path to `.md` |
| `html` | `path:` folder under `interactions/` |
| `spa` | `path:` folder with `index.html` (built app output) |
| `component` | `component:` id, optional `props:` |

Each lesson needs unique `id` (safe characters: letters, numbers, underscore, hyphen).

## Variables

```yaml
variables:
  role:
    default: employee
    type: string
```

## Flow

```yaml
flow:
  - when:
      variable:
        eq: [role, manager]
    goto: manager_module
  - when:
      assessment:
        passed: final_quiz
    goto: completion
```

See [Branching and paths](../guides/branching-and-paths.md).

## Tracking

```yaml
tracking:
  completion:
    threshold: 0.9
  xapi:
    activityIri: "https://example.com/courses/security"
    displayName: Security Awareness
```

Required for `build --target xapi|cmi5`: HTTPS `activityIri`.

## Full specification

Implementers: [Developer SPEC](../developer/SPEC.md).

## See also

- [Lesson types](lesson-types.md)  
- [Tracking and completion](tracking-and-completion.md)
