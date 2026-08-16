-- Migration 007: keep Blessures stat (B) and resync it from characters.pv_max.

BEGIN;

INSERT INTO public.static_stats (code, name, is_secondary)
VALUES ('B', 'Blessures', TRUE)
ON CONFLICT (code) DO UPDATE
SET
	name = EXCLUDED.name,
	is_secondary = EXCLUDED.is_secondary;

INSERT INTO public.character_stat_values (
	character_id,
	stat_code,
	base_value,
	current_advanced,
	total_advanced
)
SELECT
	c.id,
	'B',
	0,
	0,
	GREATEST(c.pv_max, 0)
FROM public.characters c
ON CONFLICT (character_id, stat_code) DO UPDATE
SET total_advanced = EXCLUDED.total_advanced;

COMMIT;
