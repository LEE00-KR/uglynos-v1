-- Add rarity column to pet_templates table
-- This column is required by the pet storage system to display pet rarity information

ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

-- Update existing pet templates with default rarity based on their characteristics
-- Larger pets and those that can be ridden are typically rarer
UPDATE pet_templates SET rarity = 'rare' WHERE can_ride = true AND rarity = 'common';
UPDATE pet_templates SET rarity = 'uncommon' WHERE size = 'L' AND rarity = 'common';
