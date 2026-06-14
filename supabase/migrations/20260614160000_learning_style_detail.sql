-- Add learning style details JSONB to profiles for prompt personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_style_detail JSONB;
