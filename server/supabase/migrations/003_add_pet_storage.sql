-- Add in_storage column to pets table for storage system
ALTER TABLE pets ADD COLUMN IF NOT EXISTS in_storage BOOLEAN DEFAULT false;

-- Create index for faster storage queries
CREATE INDEX IF NOT EXISTS idx_pets_in_storage ON pets(character_id, in_storage);

-- Drop old pet_storage table if exists (we're using in_storage column instead)
DROP TABLE IF EXISTS pet_storage;
