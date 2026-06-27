-- Add cxp_tooltip_dismissed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cxp_tooltip_dismissed BOOLEAN DEFAULT FALSE;
