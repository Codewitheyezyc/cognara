-- Add learning_depth column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_depth INT NOT NULL DEFAULT 2;
-- 1 = Like I'm 10, 2 = Beginner, 3 = Intermediate, 4 = Advanced, 5 = Expert

-- Add depth_level column to learning_goals table
ALTER TABLE public.learning_goals ADD COLUMN IF NOT EXISTS depth_level INT NOT NULL DEFAULT 2;
-- Allows different depth per goal
