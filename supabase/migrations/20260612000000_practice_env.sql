-- Create user_projects table for saving StackBlitz workspaces
CREATE TABLE IF NOT EXISTS public.user_projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id    UUID REFERENCES public.lessons(id),
  title        TEXT NOT NULL,
  template     TEXT NOT NULL DEFAULT 'vanilla',
  files        JSONB NOT NULL DEFAULT '{}',
  steps_done   JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Create policy for user's own projects
CREATE POLICY "own_projects" ON public.user_projects
  FOR ALL USING (auth.uid() = user_id);
