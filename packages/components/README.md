# @lxpack/components

Reusable UI widgets for LXPack courses (Phase 2).

## Built-in components

- `callout` — info/warning callout box
- `image-card` — image with caption
- `checklist` — interactive checklist

## Usage

Author a lesson with `type: component` in `course.yaml`:

```yaml
- id: tip
  type: component
  component: callout
  props:
    variant: info
    body: Remember to validate your course before export.
```

The CLI embeds `dist/bundle.js` as `lxpack-components.js` in SCORM and preview builds.

## Course overrides

Optional overrides live under `course/components/<id>/` (validated at build time).

## API

```ts
import { registerComponent, resolveComponent, BUILTIN_COMPONENT_IDS } from "@lxpack/components";
```

Browser bundle: `@lxpack/components/bundle` sets `window.__LXPACK_COMPONENTS__`.
