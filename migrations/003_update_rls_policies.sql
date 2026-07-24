-- Migration 003: Update RLS Policies for campaigns, users_campaigns, sessions, and session_notes

-- ============================================================================
-- RLS Policies for campaigns (formerly sessions)
-- ============================================================================

-- Drop existing sessions policies before recreating them
DROP POLICY IF EXISTS "MJ can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Campaign members can read sessions" ON public.sessions;

-- Drop existing sessions policies (now campaigns)
DROP POLICY IF EXISTS "Users can create sessions." ON public.campaigns;
DROP POLICY IF EXISTS "Player can read own sessions." ON public.campaigns;
DROP POLICY IF EXISTS "MJs can update own sessions." ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns." ON public.campaigns;
DROP POLICY IF EXISTS "Player can read own campaigns." ON public.campaigns;
DROP POLICY IF EXISTS "MJs can update own campaigns." ON public.campaigns;

-- Create new campaigns policies
CREATE POLICY "Users can create campaigns." ON public.campaigns FOR INSERT TO authenticated WITH CHECK ((auth.uid() = mj_id));

CREATE POLICY "Player can read own campaigns." ON public.campaigns FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.characters
  WHERE ((characters.campaign_id = campaigns.id) AND (characters.user_id = auth.uid())))));

CREATE POLICY "MJs can update own campaigns." ON public.campaigns FOR UPDATE TO authenticated USING ((auth.uid() = mj_id));

-- Ensure the helper used by users_campaigns policies matches the renamed schema
DROP POLICY IF EXISTS "MJ can read users_campaigns." ON public.users_campaigns;
DROP FUNCTION IF EXISTS public.is_session_mj(uuid);
CREATE FUNCTION public.is_session_mj(target_session_id uuid) RETURNS boolean
        LANGUAGE sql SECURITY DEFINER
        SET search_path TO ''
        AS $$
    select exists (
        select 1
        from public.campaigns c
        where c.id = target_session_id
            and c.mj_id = auth.uid()
    );
$$;

-- ============================================================================
-- RLS Policies for users_campaigns (formerly users_session)
-- ============================================================================

-- Drop existing users_session policies
DROP POLICY IF EXISTS "MJ can create users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can read users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can update users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can delete users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "User can create users_session only when user is session MJ" ON public.users_campaigns;
DROP POLICY IF EXISTS "User can read own users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "User can delete own users_session." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can create users_campaigns." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can read users_campaigns." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can update users_campaigns." ON public.users_campaigns;
DROP POLICY IF EXISTS "MJ can delete users_campaigns." ON public.users_campaigns;
DROP POLICY IF EXISTS "User can create users_campaigns only when user is campaign MJ" ON public.users_campaigns;
DROP POLICY IF EXISTS "User can read own users_campaigns." ON public.users_campaigns;
DROP POLICY IF EXISTS "User can delete own users_campaigns." ON public.users_campaigns;

-- Create new users_campaigns policies
CREATE POLICY "MJ can create users_campaigns." ON public.users_campaigns FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.campaigns
  WHERE ((campaigns.id = users_campaigns.campaign_id) AND (campaigns.mj_id = auth.uid())))));

CREATE POLICY "MJ can read users_campaigns." ON public.users_campaigns FOR SELECT TO authenticated USING (public.is_session_mj(campaign_id));

CREATE POLICY "MJ can update users_campaigns." ON public.users_campaigns FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.campaigns
  WHERE ((campaigns.id = users_campaigns.campaign_id) AND (campaigns.mj_id = auth.uid())))));

CREATE POLICY "MJ can delete users_campaigns." ON public.users_campaigns FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.campaigns
  WHERE ((campaigns.id = users_campaigns.campaign_id) AND (campaigns.mj_id = auth.uid())))));

CREATE POLICY "User can create users_campaigns only when user is campaign MJ" ON public.users_campaigns FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.campaigns c
  WHERE ((c.id = users_campaigns.campaign_id) AND (c.mj_id = auth.uid()))))));

CREATE POLICY "User can read own users_campaigns." ON public.users_campaigns FOR SELECT TO authenticated USING ((auth.uid() = user_id));

CREATE POLICY "User can delete own users_campaigns." ON public.users_campaigns FOR DELETE TO authenticated USING ((auth.uid() = user_id));

-- ============================================================================
-- RLS Policies for sessions (new entity - tags for notes)
-- ============================================================================

-- Sessions can be read by: MJ of the campaign OR active members of the campaign
CREATE POLICY "MJ can manage sessions" ON public.sessions FOR ALL TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = sessions.campaign_id AND c.mj_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = sessions.campaign_id AND c.mj_id = auth.uid()
    ));

-- Campaign members can read sessions in their campaigns
CREATE POLICY "Campaign members can read sessions" ON public.sessions FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users_campaigns uc
        WHERE uc.campaign_id = sessions.campaign_id 
            AND uc.user_id = auth.uid() 
            AND uc.active = true
    )
);

-- ============================================================================
-- RLS Policies for session_notes (updated for campaign_id)
-- ============================================================================

-- Drop existing session_notes policies
DROP POLICY IF EXISTS "MJ can read session_notes" ON public.session_notes;
DROP POLICY IF EXISTS "Players can read visible session_notes" ON public.session_notes;
DROP POLICY IF EXISTS "Session members can insert session_notes" ON public.session_notes;
DROP POLICY IF EXISTS "Authors or MJ can update session_notes" ON public.session_notes;
DROP POLICY IF EXISTS "Authors or MJ can delete session_notes" ON public.session_notes;
DROP POLICY IF EXISTS "Campaign members can insert session_notes" ON public.session_notes;

-- MJ can read all notes in their campaign (all visibility levels)
CREATE POLICY "MJ can read session_notes" ON public.session_notes FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = session_notes.campaign_id AND c.mj_id = auth.uid()
    ));

-- Players can read visible notes in their campaign (if active member)
CREATE POLICY "Players can read visible session_notes" ON public.session_notes FOR SELECT TO authenticated 
    USING (
        (is_visible = true) AND (EXISTS (
            SELECT 1 FROM public.users_campaigns uc
            WHERE uc.campaign_id = session_notes.campaign_id 
                AND uc.user_id = auth.uid() 
                AND uc.active = true
        ))
    );

-- Campaign members can create notes in non-archived campaigns
CREATE POLICY "Campaign members can insert session_notes" ON public.session_notes FOR INSERT TO authenticated 
    WITH CHECK (
        (auth.uid() IS NOT NULL) 
        AND (author_user_id = auth.uid()) 
        AND (COALESCE(length(TRIM(BOTH FROM content_text)), 0) > 0) 
        AND (EXISTS (
            SELECT 1 FROM (public.users_campaigns uc JOIN public.campaigns c ON (c.id = uc.campaign_id))
            WHERE uc.campaign_id = session_notes.campaign_id 
                AND uc.user_id = auth.uid() 
                AND uc.active = true 
                AND c.is_archived = false
        ))
    );

-- Authors or MJ can update notes (with content validation)
CREATE POLICY "Authors or MJ can update session_notes" ON public.session_notes FOR UPDATE TO authenticated 
    USING (
        (author_user_id = auth.uid()) 
        OR (EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = session_notes.campaign_id AND c.mj_id = auth.uid()
        ))
    ) 
    WITH CHECK (
        (COALESCE(length(TRIM(BOTH FROM content_text)), 0) > 0) 
        AND (
            (author_user_id = auth.uid()) 
            OR (EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = session_notes.campaign_id AND c.mj_id = auth.uid()
            ))
        )
    );

-- Authors or MJ can delete notes
CREATE POLICY "Authors or MJ can delete session_notes" ON public.session_notes FOR DELETE TO authenticated 
    USING (
        (author_user_id = auth.uid()) 
        OR (EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = session_notes.campaign_id AND c.mj_id = auth.uid()
        ))
    );

COMMIT;
