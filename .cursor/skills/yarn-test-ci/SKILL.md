---
name: yarn-test-ci
description: Runs yarn test with CI=true so Jest and other test runners do not wait for interactive input. Use when executing yarn test as an agent, in subagents, or when verifying tests in any package.
---

# Yarn Test (CI Mode)

## Rule

When running tests as an agent, **always** prefix the command with `CI=true`:

```bash
CI=true yarn test
```

Run from the target package directory (e.g. `plugins/my-plugin/`).

## Variants

```bash
# Full package
CI=true yarn test

# Single file
CI=true yarn test path/to/file.test.ts

# With Jest args (no --watch)
CI=true yarn test --testPathPattern=MyComponent
```

## Do not use

- `yarn test` without `CI=true` — may hang waiting for watch-mode or interactive prompts
- `yarn test --watch` — requires a TTY and blocks indefinitely in agent shells

## Why

Test runners (especially Jest) detect non-CI environments and enter watch or interactive modes. Agent shells have no user to dismiss prompts, so the command hangs until timeout.

Setting `CI=true` forces non-interactive, run-once behavior.
