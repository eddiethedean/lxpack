# Components

--8<-- "copy-tip.md"

**Component lessons** use built-in widgets from `@lxpack/components`. No HTML file required.

## Built-in components (v0.3.3)

| ID | Purpose | Common props |
|----|---------|--------------|
| `callout` | Highlighted message | `variant` (`info`, `warning`, …), `body` |
| `image-card` | Image with caption | image URL, caption text |
| `checklist` | Interactive checklist | list items |

## Example

```yaml
lessons:
  - id: policy_callout
    title: Policy reminder
    type: component
    component: callout
    props:
      variant: info
      body: All employees must complete this module by December 31.
```

## Validation

Component `id` must be a known built-in (or course override under `components/`). Run `lxpack validate` if you typo the name.

## Preview and export

The CLI serves and packages `lxpack-components.js` with the runtime. Component lessons render automatically in preview and SCORM builds.

## Course overrides (advanced)

Optional custom widgets live in `components/<id>/` for teams extending LXPack. Most authors use built-ins only.

## Example course

`examples/branching-demo` includes a `callout` component lesson.

## See also

- [Writing lessons](../guides/writing-lessons.md)  
- [Lesson types](lesson-types.md)
