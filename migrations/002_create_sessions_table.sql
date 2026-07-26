-- Migration 002: Create sessions table (new entity for session tags)
-- Sessions are now child entities of campaigns, with date, name, and description.
-- They are used as tags for session_notes.

-- Step 1: Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    date date NOT NULL,
    name character varying(100),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE
);

-- Ensure FK exists when table was created in a previous partial run
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sessions_campaign_id_fkey'
            AND conrelid = 'public.sessions'::regclass
    ) THEN
        ALTER TABLE public.sessions
            ADD CONSTRAINT sessions_campaign_id_fkey
            FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Step 2: Create index for efficient querying of sessions by campaign and date
CREATE INDEX IF NOT EXISTS sessions_campaign_date_idx ON public.sessions USING btree (campaign_id, date DESC);

-- Step 3: Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant table privileges to authenticated users; RLS will narrow access further
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;

-- Step 5: Add session_id column to session_notes (nullable, as notes can be untagged)
ALTER TABLE public.session_notes 
        ADD COLUMN IF NOT EXISTS session_id uuid;

-- Step 6: Add FK constraint for session_notes.session_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'session_notes_session_id_fkey'
            AND conrelid = 'public.session_notes'::regclass
    ) THEN
        ALTER TABLE public.session_notes
            ADD CONSTRAINT session_notes_session_id_fkey
            FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Step 7: Create index for efficient querying of notes by session
CREATE INDEX IF NOT EXISTS session_notes_session_idx ON public.session_notes USING btree (session_id);

COMMIT;
