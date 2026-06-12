-- Create ai_request_logs table
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own request logs
CREATE POLICY "Users can view their own request logs" ON public.ai_request_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own request logs
CREATE POLICY "Users can insert their own request logs" ON public.ai_request_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
