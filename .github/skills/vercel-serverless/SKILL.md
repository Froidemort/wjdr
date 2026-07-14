# Skill: vercel-serverless

## Constraints
- Target: TypeScript runtime within the root `api/` directory.
- Runtime: Default to edge runtime: `export const config = { runtime: 'edge' };`.
- Security: Access backend secrets via `process.env`. Never leak or reference these environment variables in the frontend scope.