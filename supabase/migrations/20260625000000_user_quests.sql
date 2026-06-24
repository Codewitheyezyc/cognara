-- Create user_quests table to track completed and claimed daily/weekly quests
CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL,
  reset_date TEXT NOT NULL, -- Format: YYYY-MM-DD for daily, YYYY-[Week Number] or Sun-date for weekly
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quest_key, reset_date)
);

-- Enable RLS
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- Set up RLS Policies
CREATE POLICY "user_quests_owner" ON public.user_quests
  FOR ALL USING (auth.uid() = user_id);
