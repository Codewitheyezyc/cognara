-- Migration: Create Content Safety Logs and Policy

CREATE TABLE IF NOT EXISTS public.content_safety_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_text       TEXT NOT NULL,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_safety_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin (4c1fbae5-c423-42e7-8394-1112fe00d42e) can read/write safety logs
DROP POLICY IF EXISTS admin_only_safety_log ON public.content_safety_log;

CREATE POLICY "admin_only_safety_log" ON public.content_safety_log
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
