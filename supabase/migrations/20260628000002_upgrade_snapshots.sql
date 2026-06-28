CREATE TABLE IF NOT EXISTS public.cognara_upgrade_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  restored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cognara_upgrade_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cognara_upgrade_snapshots' AND policyname = 'upgrade_snapshots_owner'
  ) THEN
    CREATE POLICY "upgrade_snapshots_owner" ON public.cognara_upgrade_snapshots FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;
