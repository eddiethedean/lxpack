# course.yaml reference (v0.3.1)

## Minimal course

```yaml
title: My Course
version: 1.0.0

tracking:
  completion:
    threshold: 0.9

lessons:
  - id: welcome
    title: Welcome
    type: markdown
    file: lessons/welcome.md

assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

## Lesson types

| type | Required fields |
|------|-----------------|
| markdown | `file` |
| html | `path` (under interactions/) |
| component | `component`, optional `props` |

## Variables

```yaml
variables:
  track:
    default: basic
    type: string
```

## Flow

```yaml
flow:
  - when:
      variable:
        eq: [track, advanced]
    goto: advanced_lesson
  - when:
      assessment:
        passed: final_quiz
    goto: wrap_up
```

- `goto` must match an existing lesson `id`
- `interaction.done` only for `type: html` lesson ids
- `assessment.passed` uses assessment `id` from `assessments:` list

## xAPI / cmi5

```yaml
tracking:
  completion:
    threshold: 0.9
  xapi:
    activityIri: "https://example.com/courses/my-course"
    displayName: My Course
```

`activityIri` must be HTTPS.
