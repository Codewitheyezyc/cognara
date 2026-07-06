-- Create blog posts table
CREATE TABLE IF NOT EXISTS cognara_blog_posts (
  id uuid default gen_random_uuid() primary key,
  title varchar NOT NULL,
  slug varchar UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  author_id uuid references profiles(id) ON DELETE SET NULL,
  author_type varchar default 'community', -- values: admin, community
  status varchar default 'draft', -- values: draft, pending_review, published, rejected
  category varchar, -- values: learning-tips, success-story, subject-guide, product-update
  domain varchar, -- matches user's learning domain (e.g. Technology, Business)
  tags text[],
  seo_title varchar,
  seo_description varchar,
  read_time_minutes integer,
  view_count integer default 0,
  is_featured boolean default false,
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_blog_slug ON cognara_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status_domain ON cognara_blog_posts(status, domain, published_at DESC);

-- Create phase completions table to track eligibilities
CREATE TABLE IF NOT EXISTS cognara_phase_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) ON DELETE CASCADE,
  domain varchar NOT NULL,
  phase_number integer NOT NULL,
  phase_name varchar NOT NULL,
  created_at timestamptz default now(),
  CONSTRAINT unique_user_phase UNIQUE (user_id, phase_number, domain)
);

-- Sync trigger function to auto-populate phase completions
CREATE OR REPLACE FUNCTION sync_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_domain VARCHAR;
BEGIN
  -- Look up domain from learning_goals
  SELECT domain INTO v_domain
  FROM learning_goals
  WHERE user_id = NEW.user_id AND is_active = true
  LIMIT 1;

  -- Fallback if no active goal is found (look up by goal_name)
  IF v_domain IS NULL THEN
    SELECT domain INTO v_domain
    FROM learning_goals
    WHERE user_id = NEW.user_id AND title = NEW.goal_name
    LIMIT 1;
  END IF;

  -- Default fallback
  IF v_domain IS NULL THEN
    v_domain := 'General';
  END IF;

  INSERT INTO cognara_phase_completions (user_id, domain, phase_number, phase_name)
  VALUES (NEW.user_id, v_domain, NEW.phase_number, NEW.phase_name)
  ON CONFLICT ON CONSTRAINT unique_user_phase DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up the trigger
DROP TRIGGER IF EXISTS trigger_sync_phase_completion ON cognara_certificates;
CREATE TRIGGER trigger_sync_phase_completion
AFTER INSERT ON cognara_certificates
FOR EACH ROW
EXECUTE FUNCTION sync_phase_completion();

-- Retroactively populate existing certificates
INSERT INTO cognara_phase_completions (user_id, domain, phase_number, phase_name, created_at)
SELECT 
  c.user_id,
  COALESCE(g.domain, 'General') as domain,
  c.phase_number,
  c.phase_name,
  c.created_at
FROM cognara_certificates c
LEFT JOIN learning_goals g ON g.user_id = c.user_id AND (g.is_active = true OR g.title = c.goal_name)
ON CONFLICT ON CONSTRAINT unique_user_phase DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE cognara_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognara_phase_completions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables as requested by security advisor (streak badges, progress cards, pending awards)
ALTER TABLE public.cognara_spark_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognara_practical_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognara_cancellation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognara_streak_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognara_progress_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognara_pending_awards ENABLE ROW LEVEL SECURITY;

-- Define Policies for cognara_blog_posts
DROP POLICY IF EXISTS "Allow public select of published posts" ON cognara_blog_posts;
CREATE POLICY "Allow public select of published posts"
ON cognara_blog_posts FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Allow users to select their own posts" ON cognara_blog_posts;
CREATE POLICY "Allow users to select their own posts"
ON cognara_blog_posts FOR SELECT
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow authenticated users to insert posts" ON cognara_blog_posts;
CREATE POLICY "Allow authenticated users to insert posts"
ON cognara_blog_posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow users to update their own draft/rejected posts" ON cognara_blog_posts;
CREATE POLICY "Allow users to update their own draft/rejected posts"
ON cognara_blog_posts FOR UPDATE
USING (auth.uid() = author_id AND (status = 'draft' OR status = 'rejected'))
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow admin full access to blog posts" ON cognara_blog_posts;
CREATE POLICY "Allow admin full access to blog posts"
ON cognara_blog_posts FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));

-- Define Policies for cognara_phase_completions
DROP POLICY IF EXISTS "Allow users to read their own phase completions" ON cognara_phase_completions;
CREATE POLICY "Allow users to read their own phase completions"
ON cognara_phase_completions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to phase completions" ON cognara_phase_completions;
CREATE POLICY "Allow admin full access to phase completions"
ON cognara_phase_completions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));
