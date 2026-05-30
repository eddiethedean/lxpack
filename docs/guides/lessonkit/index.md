# LessonKit & React

[LessonKit 1.0](https://github.com/eddiethedean/lessonkit) authors React courses; **LXPack** validates and packages them for the LMS via **`@lessonkit/lxpack`**.

**Who this is for:** React developers, integrators wiring CI packaging, and teams evaluating LessonKit + LXPack.

## Start here

| You are… | Go to |
|----------|--------|
| New to LessonKit | [LessonKit repo](https://github.com/eddiethedean/lessonkit) — `npx @lessonkit/cli init` |
| Packaging / API details | [LessonKit interoperability reference](../../reference/lessonkit-interoperability.md) |
| Which npm packages to install | [LessonKit and LXPack packages](../../reference/lessonkit-packages.md) |
| YAML-only courses (no React) | [File-based authoring](../file-based/index.md) |

## Workflow

```bash
npx @lessonkit/cli init my-course
cd my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

Requires **`@lxpack/api` 0.6.2+** and Node.js **18+**.

## LXPack-specific guides

| Topic | Guide |
|-------|--------|
| SCORM layout recipes | [SCORM SPA recipes](../scorm-spa-recipes.md) |
| `@lessonkit/lxpack` vs `@lxpack/lessonkit` | [Package adapters](../migrating-from-lessonkit-lxpack-adapter.md) |

## Reference

- [lessonkit.json interchange](../../reference/lessonkit-interchange.md)
- [SPA bridge (`lxpackBridge.v1`)](../../reference/spa-bridge.md)
- [LXPack upgrades (maintainers)](../../reference/lxpack-upgrades.md)

## External docs

- [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)
- [Golden packaging example](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden)

## Other tracks

- [File-based authoring](../file-based/index.md)
- [AI-assisted authoring](../ai-assisted/index.md)
