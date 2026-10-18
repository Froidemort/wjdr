-- Public read-only access to the career graph (careers, career_paths).
-- service_role privileges and its write policies are left untouched.

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "careers_select_anon" ON public.careers;
CREATE POLICY "careers_select_anon" ON public.careers
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "careers_select_authenticated" ON public.careers;
CREATE POLICY "careers_select_authenticated" ON public.careers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "career_paths_select_anon" ON public.career_paths;
CREATE POLICY "career_paths_select_anon" ON public.career_paths
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "career_paths_select_authenticated" ON public.career_paths;
CREATE POLICY "career_paths_select_authenticated" ON public.career_paths
  FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.careers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.career_paths FROM anon, authenticated;

GRANT SELECT ON TABLE public.careers TO anon, authenticated;
GRANT SELECT ON TABLE public.career_paths TO anon, authenticated;
