# Export to your LMS

**Build** creates the file your LMS imports. Choose a **target** that matches what your LMS and reporting team require.

## Choose a target

| Target | When to use |
|--------|-------------|
| **`scorm12`** | Default for most corporate LMS (Moodle, Cornerstone, etc.) |
| **`scorm2004`** | LMS requires SCORM 2004 multi-activity or sequencing |
| **`xapi`** | Tin Can / xAPI to an LRS; needs HTTPS activity IRI |
| **`cmi5`** | LMS supports cmi5 launch profile |
| **`standalone`** | Website or LMS that hosts HTML ZIP without SCORM |

Ask your LMS administrator if unsure. **Start with SCORM 1.2** unless they specify otherwise.

## Build commands

```bash
lxpack validate --target scorm12
lxpack build --target scorm12
```

Output (default): `.lxpack/<course-name>-scorm12.zip`

Other targets:

```bash
lxpack build --target scorm2004
lxpack build --target xapi
lxpack build --target cmi5
lxpack build --target standalone -o ./dist/standalone.zip
```

Unpacked folder instead of ZIP:

```bash
lxpack build --target standalone --dir -o ./dist/standalone
```

## xAPI and cmi5 requirements

Add to `course.yaml`:

```yaml
tracking:
  completion:
    threshold: 0.9
  xapi:
    activityIri: "https://training.example.com/courses/security-2026"
    displayName: Security 2026
```

- `activityIri` must be a stable **HTTPS** URL your organization controls  
- Validate before build:

  ```bash
  lxpack validate --target xapi
  lxpack build --target xapi
  ```

Examples: `examples/xapi-awareness`, `examples/cmi5-demo`.

## Default target in config

`lxpack.config.json`:

```json
{
  "exports": {
    "defaultTarget": "scorm12"
  },
  "output": {
    "dir": ".lxpack"
  }
}
```

Then `lxpack build` without `-t` uses that default.

## Handoff checklist for LMS admin

Provide:

- [ ] ZIP from `.lxpack/`  
- [ ] Target type (SCORM 1.2 / 2004 / xAPI / cmi5)  
- [ ] Completion rule (`tracking.completion.threshold`)  
- [ ] Quiz pass scores (`passingScore` per assessment)  
- [ ] Staging test accounts and date tested  

## After upload

1. Launch as a learner — complete one lesson, one lab, one quiz  
2. Confirm completion reports in LMS  
3. For SCORM 2004, test resume (suspend data) if required  
4. For xAPI, confirm statements in the LRS  

## Troubleshooting LMS issues

| Symptom | Check |
|---------|--------|
| Package won't import | Wrong SCORM version; try `scorm12` |
| Quiz always fails | `passingScore` and question keys |
| No completion | `tracking.completion.threshold` too high |
| xAPI silent | `activityIri`, LMS LRS config |

See [Troubleshooting](../reference/troubleshooting.md).

## Next

- [CLI reference](../reference/cli.md)  
- [Tracking and completion](../reference/tracking-and-completion.md)
