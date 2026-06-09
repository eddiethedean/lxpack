# Internal refactor contract (v0.7.0)

This document records invariants for the SOLID refactor. **Current release:** v0.7.0.

## Public export surfaces (must remain stable)

| Package | Export | Consumers |
|---------|--------|-----------|
| `@lxpack/runtime` | `.` → `LxpackRuntime`, types, SCORM helpers (legacy) | README, tests |
| `@lxpack/runtime` | `./client` → browser bundle entry | CLI preview, SCORM HTML |
| `@lxpack/validators` | `.` → schemas, `validateCourse`, assessment bundle APIs | cli, scorm, runtime |
| `@lxpack/scorm` | `.` → packaging, HTML, manifests | cli |
| `@lxpack/cli` | bin `lxpack` | end users |

Optional subpaths may be added; existing `.` exports must not break.

## Behavioral invariants

- `course.yaml` schema and CLI flags unchanged.
- ZIP / directory layout and embedded `__LXPACK_CONFIG__` keys unchanged.
- Assessment author YAML excluded from export ZIPs; learner bundle embedded in HTML.
- Preview blocks `/course/assessments/*` direct access.

## Verification (each phase)

```bash
pnpm install && pnpm build && pnpm lint && pnpm typecheck && pnpm test
```

## PR slicing

One logical phase per PR or commit series; tests green before merge.
