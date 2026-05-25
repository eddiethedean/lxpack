---
name: lxpack-export
description: >-
  Choose and run LXPack build targets (scorm12, scorm2004, standalone, xapi, cmi5)
  for LMS deployment. Use when packaging courses or configuring tracking.xapi.
license: Apache-2.0
metadata:
  lxpack-version: "0.3.5"
---

# LXPack export / build

## Commands

```bash
lxpack validate --target TARGET
lxpack build --target TARGET
```

Default output: `.lxpack/<course>-<target>.zip` unless `-o` or `lxpack.config.json` overrides.

## Target selection

| Target | Use when |
|--------|----------|
| `scorm12` | Default for most corporate LMS |
| `scorm2004` | LMS requires SCORM 2004 multi-activity |
| `standalone` | Host HTML ZIP without SCORM |
| `xapi` | Tin Can + LRS; needs `tracking.xapi` |
| `cmi5` | LMS supports cmi5 profile |

Read `references/export-targets.md` for xAPI IRI and config details.

## xAPI / cmi5 prerequisite

In `course.yaml`:

```yaml
tracking:
  xapi:
    activityIri: "https://your-domain.com/courses/slug"
    displayName: Human-readable title
```

Then:

```bash
lxpack validate --target xapi
lxpack build --target xapi
```

## Handoff to LMS admin

Provide: ZIP path, target type, `tracking.completion.threshold`, quiz `passingScore` values, staging test date.

## Do not

- Commit `.lxpack/` as source of truth — rebuild instead
- Use non-HTTPS `activityIri`
