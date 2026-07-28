-- Migration 005: allow MJs to read their own campaigns
-- Fixes campaign creation/read regressions when SELECT RLS does not include mj_id ownership.

BEGIN;

DROP POLICY IF EXISTS "MJ can read own campaigns." ON public.campaigns;

CREATE POLICY "MJ can read own campaigns."
ON public.campaigns
FOR SELECT
TO authenticated
USING (auth.uid() = mj_id);

DROP POLICY IF EXISTS "Users can create campaigns." ON public.campaigns;


CREATE POLICY "Users can create campaigns."

on "public"."campaigns"

to authenticated

with check (
    true
);

COMMIT;
