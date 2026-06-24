-- Add hearts and last_heart_refill_at columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_heart_refill_at TIMESTAMPTZ DEFAULT NOW();

-- Create helper function/RPC to decrement heart if user is free
CREATE OR REPLACE FUNCTION public.decrement_heart(user_id UUID)
RETURNS TABLE (new_hearts INTEGER, is_game_over BOOLEAN) AS $$
DECLARE
  v_tier TEXT;
  v_hearts INTEGER;
BEGIN
  -- Get user's subscription tier and current hearts
  SELECT subscription_tier, hearts INTO v_tier, v_hearts
  FROM public.profiles
  WHERE id = user_id;

  -- Pro users have unlimited hearts
  IF v_tier IN ('pro_monthly', 'pro_yearly') THEN
    RETURN QUERY SELECT 3, FALSE;
    RETURN;
  END IF;

  -- Decrement heart if greater than 0
  IF v_hearts > 0 THEN
    UPDATE public.profiles
    SET 
      hearts = v_hearts - 1,
      last_heart_refill_at = CASE WHEN v_hearts = 3 THEN NOW() ELSE last_heart_refill_at END
    WHERE id = user_id;
    
    v_hearts := v_hearts - 1;
  END IF;

  RETURN QUERY SELECT v_hearts, (v_hearts <= 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function/RPC to refill single heart by reviewing
CREATE OR REPLACE FUNCTION public.refill_heart(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_hearts INTEGER;
BEGIN
  SELECT hearts INTO v_hearts
  FROM public.profiles
  WHERE id = user_id;

  IF v_hearts < 3 THEN
    UPDATE public.profiles
    SET 
      hearts = v_hearts + 1,
      last_heart_refill_at = CASE WHEN v_hearts + 1 = 3 THEN NOW() ELSE last_heart_refill_at END
    WHERE id = user_id;
    
    v_hearts := v_hearts + 1;
  END IF;

  RETURN v_hearts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
