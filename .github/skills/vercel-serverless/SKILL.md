---
name: vercel-serverless
description: Vercel functions in api/. Use when creating or editing serverless endpoints or vercel.json.
---
- TypeScript in `api/`.
- Default `export const config = { runtime: 'edge' };`.
- Secrets via `process.env`; never in frontend.
- Validate input; JSON responses with proper status codes.
