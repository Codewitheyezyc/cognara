-- Create user badges table to store earned achievements
CREATE TABLE IF NOT EXISTS user_badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key    TEXT NOT NULL,
  badge_label  TEXT NOT NULL,
  badge_emoji  TEXT NOT NULL,
  subject      TEXT NOT NULL,
  earned_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key, subject)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'own_badges'
  ) THEN
    CREATE POLICY "own_badges" ON user_badges
      USING (auth.uid() = user_id);
  END IF;
END
$$;
