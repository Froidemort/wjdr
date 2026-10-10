---
description: Vercel serverless rules
applyTo: "api/**"
---
- TypeScript only; edge runtime: `export const config = { runtime: 'edge' };`.
- Secrets via `process.env`; never expose to frontend.
- Validate every input; return JSON with correct HTTP status.
- Verify auth with `supabase.auth.getUser()`.
- No stack traces in responses.
