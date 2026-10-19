-- Migration 017: interactive map (generic base markers + per-campaign markers).

-- Membership helper: campaign MJ or active member.
CREATE OR REPLACE FUNCTION public.is_campaign_member(target_campaign_id uuid)
    RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and c.mj_id = auth.uid()
  ) or exists (
    select 1
    from public.users_campaigns uc
    where uc.campaign_id = target_campaign_id
      and uc.user_id = auth.uid()
      and uc.active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_campaign_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_member(uuid) TO authenticated;

-- Marker types (shared by base and campaign markers).
CREATE TABLE IF NOT EXISTS public.map_marker_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    label text NOT NULL,
    icon text,
    color text
);

ALTER TABLE public.map_marker_types ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.map_marker_types FROM anon;
GRANT SELECT ON public.map_marker_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_marker_types TO service_role;

DROP POLICY IF EXISTS select_map_marker_types ON public.map_marker_types;
CREATE POLICY select_map_marker_types ON public.map_marker_types
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS service_role_all_map_marker_types ON public.map_marker_types;
CREATE POLICY service_role_all_map_marker_types ON public.map_marker_types
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- `icon` is a lucide icon name, `color` a CSS color.
INSERT INTO public.map_marker_types (code, label, icon, color) VALUES
    ('town', 'Ville', 'Castle', '#b45309'),
    ('point_of_interest', 'Lieu remarquable', 'MapPin', '#0369a1'),
    ('note', 'Note', 'StickyNote', '#65a30d'),
    ('danger', 'Danger', 'Skull', '#b91c1c'),
    ('objective', 'Objectif', 'Flag', '#7c3aed')
ON CONFLICT (code) DO NOTHING;

-- Generic base layer, readable by authenticated users, written by service_role only.
CREATE TABLE IF NOT EXISTS public.map_markers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id uuid NOT NULL REFERENCES public.map_marker_types (id) ON DELETE RESTRICT,
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    description text CHECK (description IS NULL OR char_length(description) <= 2000),
    lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
    -- Stable key of the import source, makes re-imports idempotent.
    external_ref text UNIQUE
);

CREATE INDEX IF NOT EXISTS map_markers_type_id_idx ON public.map_markers (type_id);

ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.map_markers FROM anon;
GRANT SELECT ON public.map_markers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_markers TO service_role;

DROP POLICY IF EXISTS select_map_markers ON public.map_markers;
CREATE POLICY select_map_markers ON public.map_markers
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS service_role_all_map_markers ON public.map_markers;
CREATE POLICY service_role_all_map_markers ON public.map_markers
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Private tile bucket (z/x/y.jpg); egress is budgeted, hence authenticated-only reads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('map-tiles', 'map-tiles', false, 1048576, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No write policy: uploads go through service_role, which bypasses RLS.
DROP POLICY IF EXISTS select_map_tiles ON storage.objects;
CREATE POLICY select_map_tiles ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'map-tiles');

-- Campaign markers: visibility 'mj' (MJ only), 'players' (whole campaign), 'private' (creator only).
CREATE TABLE IF NOT EXISTS public.campaign_markers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
    type_id uuid NOT NULL REFERENCES public.map_marker_types (id) ON DELETE RESTRICT,
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    description text CHECK (description IS NULL OR char_length(description) <= 2000),
    lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('mj', 'players', 'private')),
    created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_markers_campaign_id_idx ON public.campaign_markers (campaign_id);

ALTER TABLE public.campaign_markers ENABLE ROW LEVEL SECURITY;

-- Updates are limited to editable columns so campaign_id and created_by stay immutable.
REVOKE ALL ON public.campaign_markers FROM anon;
GRANT SELECT, INSERT, DELETE ON public.campaign_markers TO authenticated;
GRANT UPDATE (type_id, name, description, lat, lng, visibility) ON public.campaign_markers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_markers TO service_role;

DROP POLICY IF EXISTS select_campaign_markers ON public.campaign_markers;
CREATE POLICY select_campaign_markers ON public.campaign_markers
    FOR SELECT TO authenticated
    USING (
        (created_by = auth.uid() AND (public.is_campaign_member(campaign_id) OR public.is_session_mj(campaign_id)))
        OR (visibility = 'players' AND public.is_campaign_member(campaign_id))
        OR (visibility <> 'private' AND public.is_session_mj(campaign_id))
    );

DROP POLICY IF EXISTS insert_campaign_markers ON public.campaign_markers;
CREATE POLICY insert_campaign_markers ON public.campaign_markers
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND (
            public.is_session_mj(campaign_id)
            OR (visibility = 'private' AND public.is_campaign_member(campaign_id))
        )
    );

DROP POLICY IF EXISTS update_campaign_markers ON public.campaign_markers;
CREATE POLICY update_campaign_markers ON public.campaign_markers
    FOR UPDATE TO authenticated
    USING (
        (created_by = auth.uid() AND (public.is_campaign_member(campaign_id) OR public.is_session_mj(campaign_id)))
        OR (visibility <> 'private' AND public.is_session_mj(campaign_id))
    )
    WITH CHECK (
        (
            created_by = auth.uid()
            AND (public.is_campaign_member(campaign_id) OR public.is_session_mj(campaign_id))
            AND (public.is_session_mj(campaign_id) OR visibility = 'private')
        )
        OR (visibility <> 'private' AND public.is_session_mj(campaign_id))
    );

DROP POLICY IF EXISTS delete_campaign_markers ON public.campaign_markers;
CREATE POLICY delete_campaign_markers ON public.campaign_markers
    FOR DELETE TO authenticated
    USING (
        (created_by = auth.uid() AND (public.is_campaign_member(campaign_id) OR public.is_session_mj(campaign_id)))
        OR (visibility <> 'private' AND public.is_session_mj(campaign_id))
    );

DROP POLICY IF EXISTS service_role_all_campaign_markers ON public.campaign_markers;
CREATE POLICY service_role_all_campaign_markers ON public.campaign_markers
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaign_markers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_markers;
    END IF;
END
$$;
