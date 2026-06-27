-- Add referral code and link to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_link TEXT;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.cognara_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(100) UNIQUE NOT NULL,
  referral_link TEXT NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, signed_up, completed_first_lesson
  referrer_cxp_awarded BOOLEAN DEFAULT false,
  referred_cxp_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.cognara_referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_insert_own_referrals" ON public.cognara_referrals;
DROP POLICY IF EXISTS "users_read_own_referrals" ON public.cognara_referrals;
DROP POLICY IF EXISTS "admin_all_referrals" ON public.cognara_referrals;

-- RLS Policies
-- Users can insert/read their own referrals
CREATE POLICY "users_insert_own_referrals" ON public.cognara_referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "users_read_own_referrals" ON public.cognara_referrals
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

-- Admin has full access
CREATE POLICY "admin_all_referrals" ON public.cognara_referrals
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);

-- Helper function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code(user_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  generated_code VARCHAR;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    generated_code := 'CGN-' || upper(substring(user_uuid::text from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if it is unique in profiles
    SELECT NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = generated_code
    ) INTO is_unique;
  END LOOP;
  
  RETURN generated_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user trigger function to auto-create referral data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_code VARCHAR;
  generated_link TEXT;
BEGIN
  -- Generate unique referral code and link
  generated_code := public.generate_unique_referral_code(NEW.id);
  generated_link := 'https://www.cognaralearn.com/signup?ref=' || generated_code;

  INSERT INTO public.profiles (id, name, email, avatar_url, referral_source, referral_code, referral_link)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'referral_source',
    generated_code,
    generated_link
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    referral_source = COALESCE(profiles.referral_source, EXCLUDED.referral_source),
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
    referral_link = COALESCE(profiles.referral_link, EXCLUDED.referral_link);
  
  -- Insert pending record into cognara_referrals
  INSERT INTO public.cognara_referrals (referrer_user_id, referral_code, referral_link, status)
  VALUES (NEW.id, generated_code, generated_link, 'pending')
  ON CONFLICT (referral_code) DO NOTHING;

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
