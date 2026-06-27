-- Create spend_user_cxp postgres RPC function
CREATE OR REPLACE FUNCTION public.spend_user_cxp(
  user_id_input UUID,
  amount_input INTEGER,
  source_input VARCHAR(100),
  description_input TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_xp INTEGER;
  current_lvl INTEGER;
  new_xp INTEGER;
  new_lvl INTEGER;
  v_hearts INTEGER;
BEGIN
  -- Get user's current XP and Level
  SELECT COALESCE(xp, 0), COALESCE(level, 1) INTO current_xp, current_lvl FROM public.profiles WHERE id = user_id_input;
  
  -- If they don't have enough XP, fail the spend
  IF current_xp < amount_input THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement XP
  new_xp := current_xp - amount_input;
  new_lvl := 1;
  
  -- Recalculate level based on new XP
  WHILE new_xp >= 50 * new_lvl * (new_lvl + 1) LOOP
    new_lvl := new_lvl + 1;
  END LOOP;
  
  -- If the spend is to refill hearts, do it inside the transaction!
  -- This makes the action fully atomic.
  IF source_input = 'heart_refill' THEN
    SELECT hearts INTO v_hearts FROM public.profiles WHERE id = user_id_input;
    IF v_hearts < 3 THEN
      UPDATE public.profiles
      SET 
        hearts = 3,
        last_heart_refill_at = NOW()
      WHERE id = user_id_input;
    ELSE
      -- Cannot refill if already full
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Update profiles
  UPDATE public.profiles
  SET xp = new_xp, level = new_lvl
  WHERE id = user_id_input;
  
  -- Log negative CXP event in history
  INSERT INTO public.cognara_cxp_events (user_id, amount, source, description)
  VALUES (user_id_input, -amount_input, source_input, description_input);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
