-- Ensure campaign codes are unique and indexed for short-code resolution.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND indexname = 'campaigns_code_idx'
  ) THEN
    CREATE UNIQUE INDEX campaigns_code_idx ON public.campaigns USING btree (code);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'campaigns'
      AND c.conname = 'campaigns_code_key'
  ) THEN
    ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_code_key UNIQUE USING INDEX campaigns_code_idx;
  END IF;
END
$$;
