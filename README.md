# LXPack

AI-native learning experience compiler and runtime. Build web-native courses, preview locally, and export SCORM 1.2 packages for your LMS.

## Quick start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Create a new course
pnpm exec lxpack init my-course

# Preview locally
cd my-course
pnpm exec lxpack preview

# Validate and build
pnpm exec lxpack validate
pnpm exec lxpack build --target scorm12
```

## Commands

| Command | Description |
|---------|-------------|
| `lxpack init <name>` | Scaffold a new course project |
| `lxpack preview` | Start local preview server with hot reload |
| `lxpack validate` | Validate course manifest and assets |
| `lxpack build --target scorm12` | Export SCORM 1.2 ZIP package |
| `lxpack build --target standalone` | Export standalone HTML ZIP |

## Course structure

```text
course/
  course.yaml          # Course manifest
  lxpack.config.ts     # Build configuration
  lessons/             # Markdown lessons
  interactions/        # HTML/JS interactions
  assessments/         # Quiz definitions
  assets/
  theme/
```

## Packages

| Package | Description |
|---------|-------------|
| `@lxpack/cli` | Command-line interface |
| `@lxpack/runtime` | Browser course runtime |
| `@lxpack/validators` | Manifest validation (Zod) |
| `@lxpack/scorm` | SCORM 1.2 and standalone export |

## Development

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## CI and releases

- **CI** (`.github/workflows/ci.yml`) runs on pushes and PRs to `main`/`master`: lint, typecheck, build, and test.
- **Release** (`.github/workflows/release.yml`) runs on tags matching `v*.*.*` (e.g. `v1.0.0`). It builds and publishes `@lxpack/*` packages to npm using the `NPM_TOKEN` repository secret.

To release:

1. Add an npm automation token as the GitHub secret `NPM_TOKEN`.
2. Tag and push: `git tag v1.0.0 && git push origin v1.0.0`.

## Documentation

- [Technical Specification](docs/SPEC.md)
- [Product Plan](docs/PLAN.md)
- [Roadmap](docs/ROADMAP.md)

## License

Apache-2.0
