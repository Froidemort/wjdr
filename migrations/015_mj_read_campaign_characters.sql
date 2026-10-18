-- Migration 015: let the campaign MJ read characters and their links even without
-- an active users_campaigns row (the MJ membership write at campaign creation is
-- best-effort and may be denied).

-- Link tables (stats, skills, talents, weapons, armors, items) already delegate
-- their SELECT policies to this helper, so extending it covers all of them.
CREATE OR REPLACE FUNCTION public.is_character_visible(target_character_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.characters c
    where c.id = target_character_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.campaigns cp
          where cp.id = c.campaign_id
            and cp.mj_id = auth.uid()
        )
        or exists (
          select 1
          from public.users_campaigns uc
          where uc.campaign_id = c.campaign_id
            and uc.user_id = auth.uid()
            and uc.active = true
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_character_visible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_character_visible(uuid) TO authenticated;

DROP POLICY IF EXISTS "MJ can read campaign characters." ON public.characters;
CREATE POLICY "MJ can read campaign characters." ON public.characters
  FOR SELECT TO authenticated
  USING (public.is_session_mj(campaign_id));
