-- Create CXP events table
CREATE TABLE IF NOT EXISTS public.cognara_cxp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for CXP events
ALTER TABLE public.cognara_cxp_events ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "users_read_own_cxp_events" ON public.cognara_cxp_events;
CREATE POLICY "users_read_own_cxp_events" ON public.cognara_cxp_events
  FOR SELECT USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.cognara_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.cognara_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.cognara_notifications;
CREATE POLICY "users_read_own_notifications" ON public.cognara_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.cognara_notifications;
CREATE POLICY "users_update_own_notifications" ON public.cognara_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create increment_user_cxp postgres RPC function
CREATE OR REPLACE FUNCTION public.increment_user_cxp(
  user_id_input UUID,
  amount_input INTEGER
)
RETURNS void AS $$
DECLARE
  current_xp INTEGER;
  current_lvl INTEGER;
  new_xp INTEGER;
  new_lvl INTEGER;
BEGIN
  SELECT COALESCE(xp, 0), COALESCE(level, 1) INTO current_xp, current_lvl FROM public.profiles WHERE id = user_id_input;
  new_xp := current_xp + amount_input;
  new_lvl := current_lvl;
  
  WHILE new_xp >= 50 * new_lvl * (new_lvl + 1) LOOP
    new_lvl := new_lvl + 1;
  END LOOP;
  
  UPDATE public.profiles
  SET xp = new_xp, level = new_lvl
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
