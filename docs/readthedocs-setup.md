# Read the Docs setup

This repository includes `.readthedocs.yaml` and `mkdocs.yml` at the repo root for automatic documentation builds.

## One-time project setup

1. Sign in at [readthedocs.org](https://readthedocs.org) with your GitHub account.
2. **Import a project** → select `eddiethedean/lxpack`.
3. Confirm the configuration file path is **`.readthedocs.yaml`** (Read the Docs should detect it).
4. Save and trigger the first build on `main`.

## Recommended settings

| Setting | Value |
|---------|--------|
| Default version | `latest` (tracks `main`) |
| PR previews | Enable for pull requests |
| Privacy | Public |

After the first successful build, the site is available at:

**https://lxpack.readthedocs.io/en/latest/**

## Local preview

```bash title="python3 -m venv .venv-docs"
python3 -m venv .venv-docs
source .venv-docs/bin/activate   # Windows: .venv-docs\Scripts\activate
pip install -r requirements-docs.txt
export NO_MKDOCS_2_WARNING=1
mkdocs serve
```

Open `http://127.0.0.1:8000`.

Strict build (matches CI; suppresses the Material MkDocs 2.0 banner):

```bash title="bash scripts/build-docs.sh"
bash scripts/build-docs.sh
```

Or manually:

```bash title="export NO_MKDOCS_2_WARNING=1"
export NO_MKDOCS_2_WARNING=1
mkdocs build --strict
```

Set `DOCS_VERBOSE=1` to show MkDocs INFO logs during the script build.

## Versioning (optional)

When you tag releases (for example `v0.3.0`), Read the Docs can expose a **stable** version from tags. Enable “upload tags as versions” in the project Admin → Versions.

## CI

GitHub Actions runs `scripts/build-docs.sh` on every PR via the `docs` job in `.github/workflows/checks.yml`.

Read the Docs uses a custom `build.jobs.build.html` step that runs:

```bash title="NO_MKDOCS_2_WARNING=1 mkdocs build --strict --clean ..."
NO_MKDOCS_2_WARNING=1 mkdocs build --strict --clean --site-dir "$READTHEDOCS_OUTPUT/html"
```

Output **must** go to `$READTHEDOCS_OUTPUT/html`. Building only to `./site/` completes MkDocs but Read the Docs still reports **Success: False**.

## Badge for README

```markdown
[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
```

Replace `lxpack` with your Read the Docs **project slug** if it differs after import.
