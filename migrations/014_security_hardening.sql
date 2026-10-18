-- Migration 014: security hardening (WITH CHECK on updates, notification
-- abuse guard, helper function grants, RLS on reference tables).

BEGIN;

-- ============================================================================
-- Campaigns: restore ownership check on INSERT (005 relaxed it to `true`) and
-- prevent handing a campaign to another user on UPDATE.
-- ============================================================================
DROP POLICY IF EXISTS "Users can create campaigns." ON public.campaigns;
CREATE POLICY "Users can create campaigns." ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mj_id);

DROP POLICY IF EXISTS "MJs can update own campaigns." ON public.campaigns;
CREATE POLICY "MJs can update own campaigns." ON public.campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = mj_id)
  WITH CHECK (auth.uid() = mj_id);

-- ============================================================================
-- users_campaigns: MJ updates must stay within an MJ-owned campaign.
-- (session_notes UPDATE already has WITH CHECK since migration 003.)
-- ============================================================================
DROP POLICY IF EXISTS "MJ can update users_campaigns." ON public.users_campaigns;
CREATE POLICY "MJ can update users_campaigns." ON public.users_campaigns
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = users_campaigns.campaign_id AND c.mj_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = users_campaigns.campaign_id AND c.mj_id = auth.uid()
  ));

-- ============================================================================
-- notifications: sender must be the caller and be related to the receiver.
-- Related = share a campaign, or either side is an MJ (join requests go
-- player -> MJ, invitations and answers go MJ -> player).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_notify_user(target_receiver_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  select auth.uid() is not null
    and target_receiver_id is not null
    and (
      exists (select 1 from public.campaigns c where c.mj_id = auth.uid())
      or exists (select 1 from public.campaigns c where c.mj_id = target_receiver_id)
      or exists (
        select 1
        from public.users_campaigns a
        join public.users_campaigns b on b.campaign_id = a.campaign_id
        where a.user_id = auth.uid() and a.active = true
          and b.user_id = target_receiver_id and b.active = true
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_notify_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_notify_user(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can create notifications." ON public.notifications;
CREATE POLICY "Users can create notifications." ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND public.can_notify_user(receiver_user_id)
  );

-- ============================================================================
-- SECURITY DEFINER helpers: not callable by anon / PUBLIC.
-- get_email_by_username stays anon-callable (username login happens pre-auth).
-- ============================================================================
REVOKE ALL ON FUNCTION public.get_campaign_id_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_campaign_id_by_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_campaign_owner_for_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_campaign_owner_for_request(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_session_mj(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_session_mj(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_character_visible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_character_visible(uuid) TO authenticated;

-- Trigger functions are never called directly.
REVOKE ALL ON FUNCTION public.delete_old_notifications() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- RLS on reference tables created without it (public read stays intended).
-- ============================================================================
ALTER TABLE IF EXISTS public.career_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills_talents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_characteristics_select_public" ON public.career_characteristics;
CREATE POLICY "career_characteristics_select_public" ON public.career_characteristics
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "skills_talents_select_public" ON public.skills_talents;
CREATE POLICY "skills_talents_select_public" ON public.skills_talents
  FOR SELECT TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.career_characteristics FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.skills_talents FROM anon, authenticated;

COMMIT;
