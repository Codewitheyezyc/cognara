-- Create lesson cache table
CREATE TABLE IF NOT EXISTS public.cognara_lesson_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  subject TEXT NOT NULL,
  module TEXT NOT NULL,
  topic TEXT NOT NULL,
  depth_level INT NOT NULL,
  content JSONB NOT NULL,
  quality_score INT NOT NULL DEFAULT 100,
  flag_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  UNIQUE(domain, subject, module, topic, depth_level)
);

-- Index for optimized lookups
CREATE INDEX IF NOT EXISTS idx_lesson_cache_lookup
ON public.cognara_lesson_cache (domain, subject, module, topic, depth_level);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cognara_lesson_cache ENABLE ROW LEVEL SECURITY;

-- Policies to allow authenticated users to read and populate the cache
CREATE POLICY "Allow read access to all authenticated users" ON public.cognara_lesson_cache
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert access to all authenticated users" ON public.cognara_lesson_cache
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to all authenticated users" ON public.cognara_lesson_cache
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
