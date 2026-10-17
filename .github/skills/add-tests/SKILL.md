---
name: add-tests
description: Add tests for the current file
argument-hint: File to cover (default: open file)
disable-model-invocation: true
---
# Add tests

## When
Slash command only. Target = text after the command, else the open file.

## Rules
- Follow `tests.instructions.md`; apply `storybook-vitest` or `playwright-e2e` as relevant.
- Edit tests and stories only.

## Tools
- `graphify` (`get_neighbors`) for collaborators and existing tests.
- `execute/runTests` to run.

## Verify
Tests green; `prek run --files <test files>`.
