-- SAFE MIGRATION: ECO-TRONICS 2026 UUID UPGRADE
-- This script upgrades the "registrations" table to use UUID as Primary Key 
-- and auto-generates sequential team_ids using a PostgreSQL sequence.

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create sequence for team_id (starts from the next logical number)
DO $$
DECLARE
    max_team_id INTEGER;
BEGIN
    -- Extract max team_id (casting to integer as it was stored as string)
    SELECT COALESCE(MAX(team_id::INTEGER), 100) INTO max_team_id FROM registrations;
    
    -- Create the sequence
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'registrations_team_id_seq') THEN
        EXECUTE 'CREATE SEQUENCE registrations_team_id_seq START WITH ' || (max_team_id + 1);
    END IF;
END $$;

-- 3. Modify registrations table to use UUID as primary key
-- A. Drop existing primary key constraint if it exists
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_pkey;

-- B. Rename old 'id' column if it's not a UUID (Supabase defaults to BIGINT)
-- We'll check if it's already a UUID or not.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'id' AND data_type != 'uuid') THEN
        ALTER TABLE registrations RENAME COLUMN id TO old_id;
        ALTER TABLE registrations ADD COLUMN id UUID DEFAULT gen_random_uuid();
        -- Populate new id column for existing rows
        UPDATE registrations SET id = gen_random_uuid() WHERE id IS NULL;
    END IF;
END $$;

-- C. Set new 'id' column as Primary Key
ALTER TABLE registrations ADD PRIMARY KEY (id);

-- 4. Setup team_id sequence as default
-- Assuming team_id is a TEXT column based on existing JS logic
ALTER TABLE registrations ALTER COLUMN team_id SET DEFAULT nextval('registrations_team_id_seq')::TEXT;

-- 5. Ensure team_id is unique
ALTER TABLE registrations ADD CONSTRAINT registrations_team_id_key UNIQUE (team_id);

-- 6. Add comment for documentation
COMMENT ON COLUMN registrations.id IS 'Primary Key (UUID) for internal operations.';
COMMENT ON COLUMN registrations.team_id IS 'Unique sequential ID for display and legacy lookup.';
