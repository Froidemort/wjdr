---
name: vercel-serverless
description: Vercel functions in api/. Use when creating or editing serverless endpoints or vercel.json.
---
# Vercel serverless

## When
Creating or editing endpoints in `api/` or `vercel.json`.

## Rules
- Follow `.github/instructions/api.instructions.md`.
- Keep `vercel.json` rewrites aligned with `api/` routes.

## Tools
- `vercel` MCP: deployments, build/runtime logs, docs search.
- `context7` for Vercel Functions docs.

## Verify
`npm run typecheck`; `prek run --files <files>`; inspect deployment logs after deploy.
