# Quizzes and assessments

--8<-- "copy-tip.md"

Quizzes live in **`assessments/*.yaml`**. They are **multiple-choice (MCQ)** in v0.3.6.

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
| `passingScore` | Fraction correct to pass (0.7 = 70%) |
| `maxAttempts` | Optional limit on tries |
| `shuffleChoices` | Optional `true` to randomize answer order |
| `showFeedback` | `immediate`, `end`, or `never` |
| `explanation` | Shown per feedback mode (embedded at build) |

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

Common errors: two `correct: true` on one question, duplicate question `id`, or `passingScore` out of range.

## Claude workflow

Use the assessment prompt in [Prompts for Claude](prompts-for-claude.md). Always run `lxpack validate` after pasting new YAML.

## Next

- [Branching and paths](branching-and-paths.md)  
- [Export to LMS](export-to-lms.md)
