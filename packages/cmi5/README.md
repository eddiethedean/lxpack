# @lxpack/cmi5

cmi5 manifest generation for LXPack courses: one assignable unit per course, blocks per lesson/assessment, `moveOn` rules.

```bash
pnpm --filter @lxpack/cmi5 build
pnpm --filter @lxpack/cmi5 test
```

Packaging (ZIP/dir) is handled by `@lxpack/scorm` via `lxpack build --target cmi5`.
