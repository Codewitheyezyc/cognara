-- Create cognara_subscriptions table
CREATE TABLE IF NOT EXISTS public.cognara_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_code TEXT UNIQUE,
  customer_code TEXT,
  plan_code TEXT,
  status TEXT,
  amount INTEGER,
  currency VARCHAR(10) DEFAULT 'NGN',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cognara_subscriptions ENABLE ROW LEVEL SECURITY;

-- Select Policy
DROP POLICY IF EXISTS "users_read_own_subscriptions" ON public.cognara_subscriptions;
CREATE POLICY "users_read_own_subscriptions" ON public.cognara_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
