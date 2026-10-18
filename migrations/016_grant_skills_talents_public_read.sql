-- Public read-only access to skills, talents and their links for the compendium.
-- RLS policies already allow SELECT (000, 014); only the table grants for anon were missing.

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_talents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills_talents_select_public" ON public.skills_talents;
CREATE POLICY "skills_talents_select_public" ON public.skills_talents
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON TABLE public.skills TO anon, authenticated;
GRANT SELECT ON TABLE public.talents TO anon, authenticated;
GRANT SELECT ON TABLE public.skills_talents TO anon, authenticated;
