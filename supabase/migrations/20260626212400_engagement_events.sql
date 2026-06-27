-- Create cognara_engagement_events table
CREATE TABLE IF NOT EXISTS public.cognara_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cognara_engagement_events ENABLE ROW LEVEL SECURITY;

-- Set up RLS Policies
CREATE POLICY "engagement_events_owner" ON public.cognara_engagement_events
  FOR ALL USING (auth.uid() = user_id);
