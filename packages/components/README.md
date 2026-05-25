# @lxpack/components

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/components)](https://www.npmjs.com/package/@lxpack/components)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Reusable UI widgets for LXPack `type: component` lessons — built-ins, registry API, and a browser bundle for SCORM and preview.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Components reference](https://lxpack.readthedocs.io/en/latest/reference/components/) · [Lesson types](https://lxpack.readthedocs.io/en/latest/reference/lesson-types/).

| Related | Package |
|---------|---------|
| CLI / build | [`@lxpack/cli`](../cli/README.md) |
| Component ID validation | [`@lxpack/validators`](../validators/README.md) (`BUILTIN_COMPONENT_IDS`) |
| Runtime mounting | [`@lxpack/runtime`](../runtime/README.md) (`renderComponentLesson`) |
| Packaging | [`@lxpack/scorm`](../scorm/README.md) (`lxpack-components.js`) |

## Install

```bash
npm install @lxpack/components
```

Requires Node.js 20+ for the build toolchain. The published browser bundle runs in modern browsers.

## Package exports

| Import | Description |
|--------|-------------|
| `@lxpack/components` | Registry API (`registerComponent`, `getComponentMount`, `registerBuiltinComponents`) |
| `@lxpack/components/bundle` | Prebuilt `dist/bundle.js` — sets `window.__LXPACK_COMPONENTS__` |

## Built-in components

| ID | Description |
|----|-------------|
| `callout` | Info/warning callout (`variant`, `body`) |
| `image-card` | Image with caption |
| `checklist` | Interactive checklist |

Built-in IDs are validated at course build time via [`BUILTIN_COMPONENT_IDS`](../validators/src/components.ts) in `@lxpack/validators`.

## Authoring

[Writing lessons](https://lxpack.readthedocs.io/en/latest/guides/writing-lessons/) · [Course structure](https://lxpack.readthedocs.io/en/latest/guides/course-structure/).

Add a component lesson in `course.yaml`:

```yaml
lessons:
  - id: tip
    title: Pro tip
    type: component
    component: callout
    props:
      variant: info
      body: Remember to validate your course before export.
```

The CLI and SCORM packager copy the bundle to `lxpack-components.js` and load it before the runtime client. Preview serves it at `/runtime/components.js`.

## Course overrides

Optional custom widgets live under `course/components/<id>/` (validated at build time). Override IDs can replace or extend built-ins when the course manifest references them.

## Registry API

```ts
import {
  registerComponent,
  getComponentMount,
  listBuiltinComponentIds,
  registerBuiltinComponents,
  type ComponentMount,
} from "@lxpack/components";

registerBuiltinComponents();

registerComponent("my-widget", (container, props) => {
  container.textContent = String(props?.label ?? "");
});

const mount = getComponentMount("callout");
```

`ComponentMount` receives the DOM container and lesson `props` from the manifest.

## Browser bundle

The Vite build produces `dist/bundle.js`, which registers built-ins and exposes mounts on:

```ts
window.__LXPACK_COMPONENTS__
```

[`@lxpack/runtime`](../runtime/README.md) `renderComponentLesson()` looks up mounts from this global when rendering component lessons.

## Build output

| Artifact | Role |
|----------|------|
| `dist/index.js` | Node/library entry |
| `dist/bundle.js` | Browser bundle for export and preview |
| `dist/styles.css` | Component styles (copied at build) |
| `dist/*.d.ts` | Type declarations |

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/components build
pnpm --filter @lxpack/components test
pnpm --filter @lxpack/components typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation home](https://lxpack.readthedocs.io/en/latest/)
- [Components reference](https://lxpack.readthedocs.io/en/latest/reference/components/)
- [Branching demo example](https://github.com/eddiethedean/lxpack/tree/main/examples/branching-demo) · [Branching guide](https://lxpack.readthedocs.io/en/latest/guides/branching-and-paths/)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
