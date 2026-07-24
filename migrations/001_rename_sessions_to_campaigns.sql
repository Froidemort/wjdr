-- Migration 001: Rename sessions table to campaigns
-- This migration renames the 'sessions' table to 'campaigns' and updates all foreign key relationships.

-- Step 1: Rename sessions table to campaigns
DO $$
BEGIN
  IF to_regclass('public.campaigns') IS NULL AND to_regclass('public.sessions') IS NOT NULL THEN
    ALTER TABLE public.sessions RENAME TO campaigns;
  END IF;
END
$$;

-- Step 2: Rename constraints on campaigns table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_pkey'
      AND conrelid = 'public.campaigns'::regclass
  ) THEN
    ALTER TABLE public.campaigns RENAME CONSTRAINT sessions_pkey TO campaigns_pkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_code_key'
      AND conrelid = 'public.campaigns'::regclass
  ) THEN
    ALTER TABLE public.campaigns RENAME CONSTRAINT sessions_code_key TO campaigns_code_key;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_mj_id_fkey'
      AND conrelid = 'public.campaigns'::regclass
  ) THEN
    ALTER TABLE public.campaigns RENAME CONSTRAINT sessions_mj_id_fkey TO campaigns_mj_id_fkey;
  END IF;
END
$$;

-- Step 3: Update function get_session_id_by_code to get_campaign_id_by_code
DROP FUNCTION IF EXISTS public.get_session_id_by_code(text);
CREATE OR REPLACE FUNCTION public.get_campaign_id_by_code(target_code text) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select c.id
  from public.campaigns c
  where upper(c.code) = upper(target_code)
    and c.is_archived = false
  limit 1;
$$;

-- Step 4: Update function get_session_owner_for_request to get_campaign_owner_for_request
DROP FUNCTION IF EXISTS public.get_session_owner_for_request(uuid);
CREATE OR REPLACE FUNCTION public.get_campaign_owner_for_request(target_campaign_id uuid) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select c.mj_id
  from public.campaigns c
  where c.id = target_campaign_id
    and c.is_archived = false
  limit 1;
$$;

-- Step 5: Update function is_session_mj to work with campaigns (parameter name stays for compatibility)
-- This function will be called with campaign_id
CREATE OR REPLACE FUNCTION public.is_session_mj(target_session_id uuid) RETURNS boolean
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

-- Step 7: Update characters table FK: session_id -> campaign_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'characters'
      AND column_name = 'session_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'characters'
      AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.characters RENAME COLUMN session_id TO campaign_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'characters_session_id_fkey'
      AND conrelid = 'public.characters'::regclass
  ) THEN
    ALTER TABLE public.characters RENAME CONSTRAINT characters_session_id_fkey TO characters_campaign_id_fkey;
  END IF;
END
$$;

-- Step 8: Recreate FK for characters with proper reference
ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_campaign_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'characters_campaign_id_fkey'
      AND conrelid = 'public.characters'::regclass
  ) THEN
    ALTER TABLE public.characters
      ADD CONSTRAINT characters_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Step 9: Rename users_session table to users_campaigns
DO $$
BEGIN
  IF to_regclass('public.users_campaigns') IS NULL AND to_regclass('public.users_session') IS NOT NULL THEN
    ALTER TABLE public.users_session RENAME TO users_campaigns;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_session_pkey'
      AND conrelid = 'public.users_campaigns'::regclass
  ) THEN
    ALTER TABLE public.users_campaigns RENAME CONSTRAINT users_session_pkey TO users_campaigns_pkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_session_session_id_fkey'
      AND conrelid = 'public.users_campaigns'::regclass
  ) THEN
    ALTER TABLE public.users_campaigns RENAME CONSTRAINT users_session_session_id_fkey TO users_campaigns_campaign_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_session_user_id_fkey'
      AND conrelid = 'public.users_campaigns'::regclass
  ) THEN
    ALTER TABLE public.users_campaigns RENAME CONSTRAINT users_session_user_id_fkey TO users_campaigns_user_id_fkey;
  END IF;
END
$$;

-- Step 10: Rename session_id column to campaign_id in users_campaigns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_campaigns'
      AND column_name = 'session_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_campaigns'
      AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.users_campaigns RENAME COLUMN session_id TO campaign_id;
  END IF;
END
$$;

-- Step 11: Recreate FK for users_campaigns
ALTER TABLE public.users_campaigns DROP CONSTRAINT IF EXISTS users_campaigns_campaign_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_campaigns_campaign_id_fkey'
      AND conrelid = 'public.users_campaigns'::regclass
  ) THEN
    ALTER TABLE public.users_campaigns
      ADD CONSTRAINT users_campaigns_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Step 12: Update session_notes table: rename session_id to campaign_id
-- We'll keep session_id as NULL for now and add it in the next migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_notes'
      AND column_name = 'session_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_notes'
      AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.session_notes RENAME COLUMN session_id TO campaign_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_notes_session_id_fkey'
      AND conrelid = 'public.session_notes'::regclass
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_notes'
      AND column_name = 'campaign_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_notes_campaign_id_fkey'
      AND conrelid = 'public.session_notes'::regclass
  ) THEN
    ALTER TABLE public.session_notes RENAME CONSTRAINT session_notes_session_id_fkey TO session_notes_campaign_id_fkey;
  END IF;
END
$$;

-- Step 13: Recreate FK for session_notes
ALTER TABLE public.session_notes DROP CONSTRAINT IF EXISTS session_notes_campaign_id_fkey;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_notes_campaign_id_fkey'
      AND conrelid = 'public.session_notes'::regclass
  ) THEN
    ALTER TABLE public.session_notes
      ADD CONSTRAINT session_notes_campaign_id_fkey
      FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Step 14: Update is_character_visible function to use campaigns and users_campaigns
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
          from public.users_campaigns uc
          where uc.campaign_id = c.campaign_id
            and uc.user_id = auth.uid()
            and uc.active = true
        )
      )
  );
$$;

-- Step 15: Update indexes on session_notes
DROP INDEX IF EXISTS public.session_notes_session_created_idx;
CREATE INDEX IF NOT EXISTS session_notes_campaign_created_idx ON public.session_notes USING btree (campaign_id, created_at DESC);

-- Step 16: Update function search_session_notes to use campaign_id parameter name
DROP FUNCTION IF EXISTS public.search_session_notes(uuid, text);
CREATE FUNCTION public.search_session_notes(target_campaign_id uuid, search_text text) RETURNS TABLE(id uuid, campaign_id uuid, author_user_id uuid, title character varying, content_text text, is_visible boolean, is_archived boolean, created_at timestamp with time zone, updated_at timestamp with time zone, rank real)
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
  with q as (
    select websearch_to_tsquery('french', coalesce(search_text, '')) as tsq
  )
  select
    sn.id,
    sn.campaign_id,
    sn.author_user_id,
    sn.title,
    sn.content_text,
    sn.is_visible,
    sn.is_archived,
    sn.created_at,
    sn.updated_at,
    ts_rank('{0.0,0.2,0.6,1.0}'::real[], sn.fts_weighted, q.tsq, 32) as rank
  from public.session_notes sn
  cross join q
  where sn.campaign_id = target_campaign_id
    and q.tsq <> ''::tsquery
    and sn.fts_weighted @@ q.tsq
  order by rank desc, sn.created_at desc;
$$;

COMMIT;
