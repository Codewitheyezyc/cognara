-- Alter public.cognara_testimonials table
ALTER TABLE public.cognara_testimonials
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- Create public.cognara_settings table
CREATE TABLE IF NOT EXISTS public.cognara_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.cognara_settings (key, value)
VALUES ('max_homepage_testimonials', '6')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS for settings
ALTER TABLE public.cognara_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_settings" ON public.cognara_settings;
DROP POLICY IF EXISTS "admin_all_settings" ON public.cognara_settings;

CREATE POLICY "anyone_read_settings" ON public.cognara_settings
  FOR SELECT USING (true);

CREATE POLICY "admin_all_settings" ON public.cognara_settings
  FOR ALL USING (auth.uid() = '4c1fbae5-c423-42e7-8394-1112fe00d42e'::uuid);
