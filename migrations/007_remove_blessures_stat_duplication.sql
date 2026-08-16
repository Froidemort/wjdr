-- Migration 007: remove duplicated Blessures stat (B)
-- Source of truth for max wounds stays on public.characters.pv_max.

BEGIN;

DELETE FROM public.character_stat_values
WHERE stat_code = 'B';

DELETE FROM public.static_stats
WHERE code = 'B';

COMMIT;
