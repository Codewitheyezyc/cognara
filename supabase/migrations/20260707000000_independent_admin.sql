-- Create admin users table
CREATE TABLE IF NOT EXISTS cognara_admin_users (
  id uuid default gen_random_uuid() primary key,
  email varchar UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name varchar NOT NULL,
  role varchar default 'admin', -- values: super_admin, admin, moderator
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now()
);

-- Audit log for every admin action
CREATE TABLE IF NOT EXISTS cognara_admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references cognara_admin_users(id) ON DELETE SET NULL,
  action varchar NOT NULL, -- e.g. 'approved_blog_post', 'deleted_user', 'generated_badge', 'published_post'
  target_type varchar, -- e.g. 'blog_post', 'user', 'badge'
  target_id varchar,
  details jsonb,
  created_at timestamptz default now()
);
