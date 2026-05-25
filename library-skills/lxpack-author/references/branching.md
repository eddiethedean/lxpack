# Branching (variables + flow)

Study repository example: `examples/branching-demo/`.

## Pattern: learner chooses path in HTML

1. HTML interaction calls `window.parent.lxpack.setVariable('path', 'advanced')` when appropriate (interactions run in an iframe)
2. Flow rule:

```yaml
flow:
  - when:
      variable:
        eq: [path, advanced]
    goto: component_lesson
```

## Pattern: gate on quiz pass

```yaml
flow:
  - when:
      assessment:
        passed: final_quiz
    goto: wrap_up
```

## Pattern: lab must be completed

```yaml
flow:
  - when:
      interaction:
        done: phishing_lab
    goto: next_lesson
```

`done` uses the **lesson id** of the html lesson, not the folder name.

## Validate

```bash
lxpack validate
```

Flow cycle and invalid `goto` targets are reported by the validator.
