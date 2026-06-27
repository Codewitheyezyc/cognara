-- 1. Create public.decrement_user_cxp RPC function
CREATE OR REPLACE FUNCTION public.decrement_user_cxp(
  user_id_input UUID,
  amount_input INTEGER
)
RETURNS void AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_lvl INTEGER;
BEGIN
  -- Get user's current XP (which represents CXP balance)
  SELECT COALESCE(xp, 0) INTO current_xp FROM public.profiles WHERE id = user_id_input;
  
  -- Decrement XP, preventing negative balance
  new_xp := GREATEST(current_xp - amount_input, 0);
  
  -- Recalculate level based on new XP
  new_lvl := 1;
  WHILE new_xp >= 50 * new_lvl * (new_lvl + 1) LOOP
    new_lvl := new_lvl + 1;
  END LOOP;

  -- Update profiles table
  UPDATE public.profiles
  SET xp = new_xp, level = new_lvl
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the cognara_streak_restores table
CREATE TABLE IF NOT EXISTS public.cognara_streak_restores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_days_restored INTEGER NOT NULL,
  cxp_spent INTEGER DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for cognara_streak_restores
ALTER TABLE public.cognara_streak_restores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own streak restores" 
ON public.cognara_streak_restores FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own streak restores" 
ON public.cognara_streak_restores FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. Add broke_at, days_before_break, last_active, is_active columns to public.streaks
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS broke_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS days_before_break INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
