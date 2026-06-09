# Quizzes and assessments

--8<-- "copy-tip.md"

Quizzes live in **`assessments/*.yaml`**. They are **multiple-choice (MCQ)** — single-select (radio) or multi-select (checkbox, “select all that apply”).

## File example

`assessments/final.yaml`:

```yaml
id: final_quiz
title: Final Quiz
passingScore: 0.7
questions:
  - id: q1
    prompt: What should you do if you suspect phishing?
    explanation: Report to your security team — do not click links.
    choices:
      - id: a
        text: Report it to security
        correct: true
      - id: b
        text: Click the link to verify
      - id: c
        text: Forward to everyone
```

Link in `course.yaml`:

```yaml
assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

## Field guide

| Field | Meaning |
|-------|---------|
| `passingScore` | Fraction of total question score to pass (0.7 = 70%). Each question contributes equally; multi-select questions use partial credit (see below). |
| `selectionMode` | Optional `single` or `multiple`. Inferred from correct count when omitted (`1` → single, `2+` → multiple). |
| `maxAttempts` | Optional limit on tries |
| `shuffleChoices` | Optional `true` to randomize answer order |
| `showFeedback` | `immediate`, `end`, or `never` |
| `explanation` | Shown per feedback mode (embedded at build) |

## Multi-select (select all that apply)

Mark **two or more** choices with `correct: true` on one question (or set `selectionMode: multiple`). The learner shell renders **checkboxes** and requires an explicit **Submit assessment** click.

**Scoring:** each question is worth 1 point. For multi-select, partial credit = (correct choices selected) ÷ (total correct choices). If the learner selects **any incorrect** choice, that question scores **0**. Overall score is the average across questions; `passingScore` is compared to that fraction (same as single-select).

```yaml
questions:
  - id: q1
    prompt: Which are security best practices?
    choices:
      - id: a
        text: Use strong passwords
        correct: true
      - id: b
        text: Share credentials in chat
      - id: c
        text: Enable MFA
        correct: true
```

## Authoring vs learner package

!!! warning "YAML stays in your project"
    `assessments/*.yaml` is for **you and Claude** to edit. When you `lxpack build`, quiz content is **embedded** in the HTML package. Learners do not download separate answer files from the LMS.

This protects answer keys while keeping Git-friendly authoring.

## Flow based on quiz pass

```yaml
flow:
  - when:
      assessment:
        passed: final_quiz
    goto: certificate_lesson
```

Use the assessment `id` from `course.yaml`, not the filename.

## Validate

```bash title="lxpack validate"
lxpack validate
```

Common errors: no `correct: true` on a question, `selectionMode: multiple` with fewer than two correct choices, duplicate question `id`, or `passingScore` out of range.

## Claude workflow

Use the assessment prompt in [Prompts for Claude](prompts-for-claude.md). Always run `lxpack validate` after pasting new YAML.

## Next

- [Branching and paths](branching-and-paths.md)  
- [Export to LMS](export-to-lms.md)
