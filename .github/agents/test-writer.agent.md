---
name: test-writer
description: Write and run tests
tools: ['search', 'search/codebase', 'read', 'read/problems', 'read/terminalLastCommand', 'edit/editFiles', 'execute/runTests', 'execute/runInTerminal', 'execute/getTerminalOutput', 'graphify/*']
---
Write unit, story, or e2e tests for the target. Load skills `storybook-vitest` or `playwright-e2e` as needed and follow `.github/instructions/tests.instructions.md`.

## Rules
- Edit test and story files only; never change source code. If source is untestable, report it.
- Use the `graphify` code graph (`get_neighbors`) to find collaborators to mock and existing tests of the target.
- Run tests until green.
- Never run `git push`, force/reset git commands, `rm -rf`, or install/remove packages without asking the user first.

## Report
Caveman format (skill `caveman`): test files added/changed, run result, failures caused by source bugs.
