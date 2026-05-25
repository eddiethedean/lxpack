# Install the CLI

The `lxpack` command creates courses, runs preview, checks for errors, and builds LMS packages.

--8<-- "copy-tip.md"

## Install

With Node.js 20+ installed:

```bash title="Install LXPack CLI (Node.js 20+)"
npm install -g @lxpack/cli
```

**Success looks like:** npm finishes without errors.

## Verify

```bash title="Verify lxpack is installed"
lxpack --version
```

You should see the installed version (for example `0.3.4`).

## Create a course folder

From any directory where you keep training projects:

```bash title="lxpack init security-training"
lxpack init security-training
cd security-training
```

(Or use any course name instead of `security-training`.)

This creates a starter project with a welcome lesson, a sample phishing lab, and a short quiz. See [Your first course](your-first-course.md).

## Common install issues

### `command not found: lxpack`

Node’s global bin folder may not be on your PATH.

=== "macOS / Linux"

    Add this to your shell profile (`~/.zshrc` or `~/.bashrc`), then open a new Terminal window:

```bash title="export PATH='$(npm config get prefix)/bin:$PATH'"
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

```bash title="node --version"
node --version
```

Must be **v20.0.0** or higher. Upgrade Node from [nodejs.org](https://nodejs.org) if needed.

## Updating LXPack

```bash title="Update LXPack CLI"
npm update -g @lxpack/cli
```

## Next step

[Your first course](your-first-course.md)
