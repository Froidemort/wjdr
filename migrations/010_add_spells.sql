-- Migration: 010_add_spells
-- Add spells to the compendium

CREATE TABLE IF NOT EXISTS spells (
    id SERIAL PRIMARY KEY,
    range TEXT,
    duration TEXT,
    category TEXT,
    name TEXT,
    difficulty INTEGER,
    casting_time TEXT,
    bonus_ingredient TEXT,
    bonus INTEGER,
    description TEXT
);

-- Add RLS & GRANTs

-- Public access for anon to spells
GRANT SELECT ON spells TO public;

ALTER TABLE spells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_spells ON spells;
CREATE POLICY select_spells ON spells
    FOR SELECT
    USING (true);

-- Insert, update, select for service role
GRANT INSERT, UPDATE, SELECT ON spells TO service_role;

DROP POLICY IF EXISTS service_role_insert_spells ON spells;
CREATE POLICY service_role_insert_spells ON spells
    FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS service_role_update_spells ON spells;
CREATE POLICY service_role_update_spells ON spells
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS service_role_select_spells ON spells;
CREATE POLICY service_role_select_spells ON spells
    FOR SELECT
    TO service_role
    USING (true);
