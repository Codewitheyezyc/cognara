-- Create cognara_testimonials table
CREATE TABLE IF NOT EXISTS public.cognara_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_initial VARCHAR(10) NOT NULL,
  learning_goal VARCHAR(255) NOT NULL,
  testimonial_text TEXT NOT NULL,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cognara_testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "anyone_read_approved_testimonials" ON public.cognara_testimonials;
DROP POLICY IF EXISTS "users_insert_own_testimonials" ON public.cognara_testimonials;
DROP POLICY IF EXISTS "users_read_own_testimonials" ON public.cognara_testimonials;
DROP POLICY IF EXISTS "admin_all_testimonials" ON public.cognara_testimonials;

-- RLS Policies
-- Anyone can view approved testimonials
CREATE POLICY "anyone_read_approved_testimonials" ON public.cognara_testimonials
  FOR SELECT USING (is_approved = TRUE);

-- Users can insert their own testimonials
CREATE POLICY "users_insert_own_testimonials" ON public.cognara_testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can select their own testimonials
CREATE POLICY "users_read_own_testimonials" ON public.cognara_testimonials
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can manage all testimonials
CREATE POLICY "admin_all_testimonials" ON public.cognara_testimonials
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
