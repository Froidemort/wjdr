---
name: review-pr
description: Review current changes
argument-hint: PR number (default: uncommitted diff)
disable-model-invocation: true
---
# Review changes

## When
Slash command only. Target = text after the command, else the uncommitted diff.

## Rules
- Report bugs, security (OWASP, RLS), missing tests, rule violations. Findings only, no edits.

## Tools
`changes` for the diff; `github` for PRs; `graphify` (`get_pr_impact`, `get_neighbors`); `supabase` MCP advisors; delegate to `reviewer` agent when available.

## Verify
Output the `reviewer` table format and a one-line verdict.
