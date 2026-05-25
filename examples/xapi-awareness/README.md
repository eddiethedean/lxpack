# xAPI awareness example

Fork of `security-awareness` with `tracking.xapi.activityIri` for Tin Can export.

```bash
cd examples/xapi-awareness
lxpack validate
lxpack build --target xapi
```

Upload the ZIP to an LRS or open `index.html` with launch query params (`endpoint`, `auth`, `actor`, `registration`).
