-- Statement 1: Update cognara_admin_users to add avatar_url and updated_at
ALTER TABLE public.cognara_admin_users
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Statement 2: Update profiles to track if free user has written their one free blog post
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS free_blog_post_used boolean default false;
