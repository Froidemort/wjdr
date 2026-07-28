-- Migration 006 : Add career characteristics to the database
-- This migration adds a new table to store career characteristics for each career.

BEGIN;

CREATE TABLE IF NOT EXISTS public.career_characteristics (
    career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
    stat_code INT REFERENCES public.stats(code) ON DELETE CASCADE,
    value INT NOT NULL,
    CONSTRAINT career_characteristics_pkey PRIMARY KEY (career_id, stat_code),
    CONSTRAINT career_characteristics_value_check CHECK (value >= 0 AND value <= 100)
) TABLESPACE pg_default;

COMMIT;