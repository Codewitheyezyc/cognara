-- Create index on certificate_id for fast verification lookups
CREATE INDEX IF NOT EXISTS idx_certificate_id 
ON public.cognara_certificates(certificate_id);

-- Add referral_source column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);

-- Update trigger function to include referral_source synchronization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, referral_source)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'referral_source'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    referral_source = COALESCE(profiles.referral_source, EXCLUDED.referral_source);
  
  INSERT INTO public.streaks (user_id, current_streak, longest_streak)
  VALUES (
    NEW.id,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cognara_verify_page_visits table to track public certificate views and conversions

CREATE TABLE IF NOT EXISTS public.cognara_verify_page_visits (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id VARCHAR(100) NOT NULL,
  visitor_ip_hash VARCHAR(64),
  referrer VARCHAR(255),
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cognara_verify_page_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "allow_public_insert_verify_visits" ON public.cognara_verify_page_visits;
DROP POLICY IF EXISTS "admin_all_verify_visits" ON public.cognara_verify_page_visits;

-- RLS Policies
-- Allow anyone (public/non-authenticated visitors) to record their visits
CREATE POLICY "allow_public_insert_verify_visits" ON public.cognara_verify_page_visits
  FOR INSERT WITH CHECK (true);

-- Allow admin to read and manage visit data
CREATE POLICY "admin_all_verify_visits" ON public.cognara_verify_page_visits
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
