-- Create technology versions tracking table
CREATE TABLE IF NOT EXISTS public.cognara_technology_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  technology_name varchar UNIQUE NOT NULL,
  current_stable_version varchar NOT NULL,
  release_date date,
  documentation_url text,
  key_changes text,
  domain varchar NOT NULL,
  last_updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cognara_technology_versions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to versions
CREATE POLICY "Allow public read access to technology versions" 
  ON public.cognara_technology_versions 
  FOR SELECT 
  TO authenticated, anon 
  USING (true);

INSERT INTO public.cognara_technology_versions (technology_name, current_stable_version, release_date, documentation_url, key_changes, domain) VALUES
('Next.js', '16.2.7', '2024-12-01', 
 'https://nextjs.org/docs', 
 'App Router stable, Server Actions stable, Turbopack default', 'web_development'),

('React', '19.0', '2024-12-05',
 'https://react.dev',
 'New hooks, improved Server Components, Actions API', 'web_development'),

('Supabase', 'latest', '2025-01-01',
 'https://supabase.com/docs',
 'Always use latest Supabase JS client',
 'web_development'),

('Python', '3.12', '2024-10-01',
 'https://docs.python.org/3.12',
 'Improved error messages, faster performance',
 'data_science'),

('Node.js', '20 LTS', '2024-10-01',
 'https://nodejs.org/docs',
 'Long term support version — recommended for production', 'web_development'),

('TypeScript', '5.3', '2024-11-01',
 'https://www.typescriptlang.org/docs',
 'Import attributes, improved narrowing',
 'web_development'),

('Tailwind CSS', '3.4', '2024-01-01',
 'https://tailwindcss.com/docs',
 'Dynamic viewport units, :has() support',
 'web_development')
ON CONFLICT (technology_name) DO NOTHING;
