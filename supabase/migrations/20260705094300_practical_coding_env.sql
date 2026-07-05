-- Add new fields to support coding environment
ALTER TABLE cognara_lesson_cache
ADD COLUMN IF NOT EXISTS practical_starter_code text,
ADD COLUMN IF NOT EXISTS practical_expected_output text,
ADD COLUMN IF NOT EXISTS practical_language varchar,
ADD COLUMN IF NOT EXISTS practical_complexity varchar;
-- values: simple, complex
