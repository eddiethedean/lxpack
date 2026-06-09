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
  - from: choose_path
    when:
      variable:
        eq: [role, manager]
    goto: manager_module
  - from: final_quiz
    when:
      assessment:
        passed: final_quiz
    goto: completion
```

Optional `from` is the activity id the learner must be on for the rule to run. `variable.eq` rules without `from` are ignored at runtime (the validator warns); set `from` on the step where the branch should fire. Rules with `interaction.done` or `assessment.passed` infer `from` when omitted.

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

## Assessments (author YAML)

Referenced from `course.yaml` via `assessments[].file`. Author files live under `assessments/` and are **not** shipped in export ZIPs — keys are embedded at build time.

```yaml
id: hazards_quiz
title: Select all risks
passingScore: 0.7
questions:
  - id: q1
    prompt: Select all social-engineering risks
    choices:
      - id: phishing
        text: Phishing email
        correct: true
      - id: portal
        text: IT service portal
      - id: tailgating
        text: Tailgating
        correct: true
```

### Question fields

| Field | Description |
|-------|-------------|
| `id` | Unique question id |
| `prompt` | Question text |
| `choices` | At least one choice; each needs unique `id` and `text` |
| `correct` | Mark one or more choices `correct: true` |
| `selectionMode` | Optional `single` or `multiple`. Omitted: infer from correct count (`1` → single, `2+` → multiple) |
| `explanation` | Optional feedback text (embedded at build) |

### Validation rules

- At least one `correct: true` per question
- `selectionMode: single` requires exactly one correct choice
- `selectionMode: multiple` (or inferred multi-select) requires at least two correct choices
- `passingScore` is a fraction from 0 to 1

See [Quizzes and assessments](../guides/quizzes-and-assessments.md) for scoring semantics.

## Related

- [Lesson types](lesson-types.md)
- [Tracking and completion](tracking-and-completion.md)
