-- Add main_roadmap column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_roadmap JSONB;
