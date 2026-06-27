-- Add status and completed_at columns to learning_goals table
ALTER TABLE public.learning_goals 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

ALTER TABLE public.learning_goals 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create cognara_goal_celebrations table to track completed goal celebrations
CREATE TABLE IF NOT EXISTS public.cognara_goal_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  celebrated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

-- Enable RLS
ALTER TABLE public.cognara_goal_celebrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_insert_own_goal_celebrations" ON public.cognara_goal_celebrations;
DROP POLICY IF EXISTS "users_read_own_goal_celebrations" ON public.cognara_goal_celebrations;
DROP POLICY IF EXISTS "admin_all_goal_celebrations" ON public.cognara_goal_celebrations;

-- RLS Policies
-- Users can insert their own goal celebrations
CREATE POLICY "users_insert_own_goal_celebrations" ON public.cognara_goal_celebrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own goal celebrations
CREATE POLICY "users_read_own_goal_celebrations" ON public.cognara_goal_celebrations
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all goal celebrations
CREATE POLICY "admin_all_goal_celebrations" ON public.cognara_goal_celebrations
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
