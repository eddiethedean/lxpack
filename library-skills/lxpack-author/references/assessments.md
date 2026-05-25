# Assessment YAML (v0.3.4)

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

## Validation rules

- Exactly one `correct: true` per question
- Unique `id` per question and per choice within a question
- `passingScore` between 0 and 1

## Security

Author YAML stays in the repo. `lxpack build` embeds learner-safe data in HTML — never serve raw YAML to learners.
