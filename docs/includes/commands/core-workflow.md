```bash title="Validate course (run from course folder)"
lxpack validate
```

```bash title="Validate for xAPI/cmi5 export"
lxpack validate --target xapi
```

```bash title="Start local preview server"
lxpack preview
```

```bash title="Build SCORM 1.2 package (most LMS)"
lxpack build --target scorm12
```

```bash title="Build SCORM 2004 package"
lxpack build --target scorm2004
```

```bash title="Build xAPI package"
lxpack build --target xapi
```

```bash title="Build cmi5 package"
lxpack build --target cmi5
```

```bash title="Typical workflow after editing files"
lxpack validate
lxpack preview
lxpack build --target scorm12
```
