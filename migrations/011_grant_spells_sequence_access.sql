-- Allow service_role inserts to generate spell IDs from the SERIAL sequence.
GRANT USAGE ON SEQUENCE public.spells_id_seq TO service_role;
