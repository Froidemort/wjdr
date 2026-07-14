# Skill: supabase-data

## Constraints
- Database Types: Always map queries using auto-generated CLI schema definitions: `Database['public']['Tables'][TableName]['Row'|'Insert']`.
- Pattern: Always destructure responses: `const { data, error } = await supabase...`.
- Guard Clauses: Check errors immediately: `if (error) throw error;`.
- Auth: Use `supabase.auth.getUser()` for secure server/client identity check, never `getSession()`.