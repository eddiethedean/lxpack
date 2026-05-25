# Install the CLI

The `lxpack` command creates courses, runs preview, checks for errors, and builds LMS packages.

## Install

With Node.js 20+ installed:

```bash
npm install -g @lxpack/cli
```

**Success looks like:** npm finishes without errors.

## Verify

```bash
lxpack --version
```

You should see the installed version (for example `0.3.0`).

## Create a course folder

From any directory where you keep training projects:

```bash
lxpack init security-training
cd security-training
```

This creates a starter project with a welcome lesson, a sample phishing lab, and a short quiz. See [Your first course](your-first-course.md).

## Common install issues

### `command not found: lxpack`

Node’s global bin folder may not be on your PATH.

=== "macOS / Linux"

    Add this to your shell profile (`~/.zshrc` or `~/.bashrc`), then open a new Terminal window:

    ```bash
    export PATH="$(npm config get prefix)/bin:$PATH"
    ```

=== "Windows"

    Re-run the Node installer and ensure **Add to PATH** is checked. Restart Command Prompt.

### Permission errors on `npm install -g`

=== "macOS / Linux"

    Prefer a Node version manager, or ask IT to install `@lxpack/cli` for you. Avoid `sudo npm install -g` unless your organization expects it.

=== "Windows"

    Run Command Prompt as a normal user first. If IT blocks global installs, they can install the CLI on your behalf.

### Wrong Node version

```bash
node --version
```

Must be **v20.0.0** or higher. Upgrade Node from [nodejs.org](https://nodejs.org) if needed.

## Updating LXPack

```bash
npm update -g @lxpack/cli
```

## Next step

[Your first course](your-first-course.md)
