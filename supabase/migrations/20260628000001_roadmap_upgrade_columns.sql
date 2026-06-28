-- Add roadmap upgrade state columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roadmap_upgraded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS roadmap_upgrade_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upgrade_declined BOOLEAN DEFAULT false;
