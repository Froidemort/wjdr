-- Migration 008: drop duplicated max wounds column from characters.
-- Source of truth for wounds max is character_stat_values where stat_code = 'B'.

BEGIN;

ALTER TABLE public.characters
    DROP CONSTRAINT IF EXISTS characters_pv_max_check;

ALTER TABLE public.characters
    DROP CONSTRAINT IF EXISTS check_pv_bounds;

ALTER TABLE public.characters
    DROP COLUMN IF EXISTS pv_max;

COMMIT;
