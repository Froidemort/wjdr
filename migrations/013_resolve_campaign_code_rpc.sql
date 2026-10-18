-- Migration 013: anon-safe campaign short-code resolver.
-- Replaces service-role access in api/campaigns/[identifier].ts.

BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_campaign_code(code text)
RETURNS TABLE (id uuid, mj_id uuid, is_archived boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  select c.id, c.mj_id, c.is_archived
  from public.campaigns c
  where c.code = upper(btrim(resolve_campaign_code.code))
  limit 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_campaign_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_campaign_code(text) TO anon, authenticated;

COMMIT;
