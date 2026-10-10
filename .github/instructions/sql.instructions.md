---
description: SQL migration rules
applyTo: "migrations/**/*.sql"
---
- File name: `NNN_<snake_case>.sql`, next free number.
- Enable RLS on every new table; add explicit policies.
- Idempotent: `IF NOT EXISTS` / `IF EXISTS`, `CREATE OR REPLACE`.
- Never edit an applied migration; add a new one.
- Regenerate Supabase types after schema change.
