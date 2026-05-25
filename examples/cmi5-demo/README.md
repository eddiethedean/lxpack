# cmi5 demo example

Security-awareness course configured for cmi5 packaging.

```bash
cd examples/cmi5-demo
lxpack validate
lxpack build --target cmi5
```

Import the package into a cmi5-aware LMS. The LMS supplies LRS credentials via launch URL parameters (not embedded in the ZIP).
