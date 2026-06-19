-- Migration: Migrate billing columns from LemonSqueezy to Paystack
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;
