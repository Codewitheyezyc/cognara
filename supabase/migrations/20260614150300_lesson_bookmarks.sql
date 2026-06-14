-- Create lesson_bookmarks table
CREATE TABLE IF NOT EXISTS public.lesson_bookmarks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  lesson_title    TEXT NOT NULL,
  section_index   INT NOT NULL,
  section_heading TEXT NOT NULL,
  section_body    TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lesson_bookmarks ENABLE ROW LEVEL SECURITY;

-- Add RLS Policy
CREATE POLICY "own_bookmarks" ON public.lesson_bookmarks
  FOR ALL USING (auth.uid() = user_id);
