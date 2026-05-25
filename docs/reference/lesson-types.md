# Lesson types

Each entry in `course.yaml` `lessons:` has a `type` field.

## markdown

Text content from `lessons/*.md`.

```yaml
  - id: intro
    title: Introduction
    type: markdown
    file: lessons/intro.md
```

Authoring: [Writing lessons](../guides/writing-lessons.md).

## html

Embedded web activity from `interactions/<folder>/index.html`.

```yaml
  - id: lab
    title: Hands-on lab
    type: html
    path: interactions/lab
```

Authoring: [Building interactions](../guides/building-interactions.md).

## component

Built-in widget from `@lxpack/components` — no custom HTML required.

```yaml
  - id: tip
    title: Important
    type: component
    component: callout
    props:
      variant: warning
      body: Complete the lab before continuing.
```

Widgets: [Components](components.md).

## Choosing a type

| Need | Type |
|------|------|
| Reading, policy, explanation | `markdown` |
| Clicks, simulation, custom UI | `html` |
| Callout, checklist, image card | `component` |

## See also

- [course.yaml](course-yaml.md)
