-- Create cognara_share_events table
CREATE TABLE IF NOT EXISTS public.cognara_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  certificate_id VARCHAR(100) NOT NULL,
  share_platform VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cognara_share_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_insert_own_share_events" ON public.cognara_share_events;
DROP POLICY IF EXISTS "users_read_own_share_events" ON public.cognara_share_events;
DROP POLICY IF EXISTS "admin_all_share_events" ON public.cognara_share_events;

-- RLS Policies
-- Users can insert their own share events
CREATE POLICY "users_insert_own_share_events" ON public.cognara_share_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can select their own share events
CREATE POLICY "users_read_own_share_events" ON public.cognara_share_events
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all share events
CREATE POLICY "admin_all_share_events" ON public.cognara_share_events
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
