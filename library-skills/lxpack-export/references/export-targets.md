# Export targets (v0.3.2)

## SCORM 1.2

```bash
lxpack validate --target scorm12
lxpack build --target scorm12
```

Single SCO, `imsmanifest.xml`, suspend_data limit 4096 chars (runtime handles).

## SCORM 2004

```bash
lxpack build --target scorm2004
```

Multi-SCO: `sco/<activityId>/index.html` per lesson. Test in SCORM Cloud or LMS staging.

## Standalone

```bash
lxpack build --target standalone
lxpack build --target standalone --dir -o ./dist/out
```

## xAPI

Requires:

```yaml
tracking:
  xapi:
    activityIri: "https://example.test/courses/demo"
    displayName: Demo Course
```

Produces `tincan.xml` and runtime `mode: xapi`.

Preview logging (optional) in `lxpack.config.json`:

```json
{
  "xapi": {
    "preview": {
      "logStatements": true,
      "mockLrs": true
    }
  }
}
```

## cmi5

Same `tracking.xapi` as xAPI. Produces `cmi5.xml`.

## lxpack.config.json defaults

```json
{
  "exports": { "defaultTarget": "scorm12" },
  "output": { "dir": ".lxpack" }
}
```
