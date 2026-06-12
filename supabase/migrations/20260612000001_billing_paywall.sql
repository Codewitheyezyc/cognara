-- Add subscription tracking columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;

-- Create helper function for RLS or DB checking
CREATE OR REPLACE FUNCTION public.is_pro(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND subscription_tier IN ('pro_monthly', 'pro_yearly')
    AND subscription_status = 'active'
    AND (subscription_end_date IS NULL OR subscription_end_date > NOW())
  )
$$ LANGUAGE sql SECURITY DEFINER;
