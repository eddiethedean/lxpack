# Assessment YAML (v0.5.0)

File lives under `assessments/`. Referenced from `course.yaml`:

```yaml
assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

## Example

```yaml
id: final_quiz
title: Final Quiz
passingScore: 0.7
maxAttempts: 3
shuffleChoices: true
showFeedback: immediate
questions:
  - id: q1
    prompt: Question text?
    explanation: Shown per feedback mode.
    choices:
      - id: a
        text: Correct answer
        correct: true
      - id: b
        text: Wrong answer
```

## Multi-select (select all that apply)

Mark **two or more** choices `correct: true`, or set `selectionMode: multiple`:

```yaml
questions:
  - id: q1
    prompt: Select all risks
    choices:
      - id: phishing
        text: Phishing email
        correct: true
      - id: tailgating
        text: Tailgating
        correct: true
      - id: portal
        text: IT service portal
```

## Validation rules

- At least one `correct: true` per question
- `selectionMode: single` requires exactly one correct choice
- `selectionMode: multiple` (or inferred from 2+ correct) requires at least two correct choices
- Unique `id` per question and per choice within a question
- `passingScore` between 0 and 1

## Security

Author YAML stays in the repo. `lxpack build` embeds learner-safe data in HTML — never serve raw YAML to learners.
