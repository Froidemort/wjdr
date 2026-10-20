---
name: git-cascade
description: Split working-tree changes into logical conventional commits on cascaded branches, never pushing. Use when asked to commit or organize changes into branches.
---
# Git cascade

## When
User asks to commit, organize into branches, or prepare PRs.

## Rules
- Never push, force, reset, rebase published history, `--no-verify`. Prefix commands with `rtk`.
- Branch names: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`; conventional commits in English.
- Dependent topics: branch from the previous topic branch (cascade); independent ones from the base.
- One coherent change per commit; tests with the behavior they cover; migrations with their repository/types.

## Steps
1. `rtk git status --short`, `rtk git branch --show-current`, `rtk git diff --stat`.
2. Group files by topic (feature, tests, chore/deps, docs); list the plan, ask only if grouping is ambiguous.
3. Per group, in dependency order: create/switch branch, `git add <paths>` (`-p` to split a file), `prek run --files <paths>`, commit.
4. Never stage `.env*`, `tmp/`, `coverage/`, `test-results/`, build output.
5. End on the original branch unless told otherwise.

## Report
Table: branch, base, commits (subject lines). Note anything left uncommitted. Remind: push is the user's job.
