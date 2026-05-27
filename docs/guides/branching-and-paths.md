# Branching and paths

--8<-- "copy-tip.md"

LXPack supports **non-linear** courses with **variables** and **flow** rules (v0.2+). If you omit `flow`, learners move through `lessons` in list order.

## Variables

Declare defaults in `course.yaml`:

```yaml
variables:
  track:
    default: basic
    type: string
```

HTML interactions can change variables (advanced):

```javascript
if (window.parent.lxpack) {
  window.parent.lxpack.setVariable('track', 'advanced');
}
```

## Flow rules

Each rule has `when` (condition) and `goto` (lesson `id`):

```yaml
flow:
  - when:
      variable:
        eq: [track, advanced]
    goto: advanced_lab
  - when:
      assessment:
        passed: final_quiz
    goto: wrap_up
```

| Condition | Meaning |
|-----------|---------|
| `variable.eq: [name, value]` | Variable equals value |
| `assessment.passed: <id>` | Learner passed that quiz |
| `interaction.done: <lesson_id>` | HTML or SPA lesson tracked completion |
| `all: [...]` / `any: [...]` | Combine conditions |

## Full example

Study `examples/branching-demo/` in the repository:

- `interactions/choose-path` sets the path  
- `component` lesson for advanced track  
- Quiz gate before wrap-up  

```bash title="cd examples/branching-demo"
cd examples/branching-demo
lxpack preview
```

## Validate carefully

```bash title="lxpack validate"
lxpack validate
```

Errors often mean:

- `goto` points to a lesson `id` that does not exist  
- `interaction.done` references a lesson that is not `html` or `spa`  
- Flow graph has impossible cycles (validator reports cycles)

## Authoring tip

Sketch the flow on paper first. Name every lesson `id` before writing `flow`. Use Claude with the branching section of [Prompts for Claude](prompts-for-claude.md).

## SCORM note

SCORM 2004 multi-SCO packages map activities to separate launch pages. Start with SCORM 1.2 while learning branching, unless your LMS requires 2004.

## Next

- [Preview and review](preview-and-review.md)  
- [course.yaml reference](../reference/course-yaml.md)
