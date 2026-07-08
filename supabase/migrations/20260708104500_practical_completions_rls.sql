-- RLS policies for cognara_practical_completions
DROP POLICY IF EXISTS "Allow users to read their own practical completions" ON public.cognara_practical_completions;
CREATE POLICY "Allow users to read their own practical completions"
ON public.cognara_practical_completions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own practical completions" ON public.cognara_practical_completions;
CREATE POLICY "Allow users to insert their own practical completions"
ON public.cognara_practical_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to practical completions" ON public.cognara_practical_completions;
CREATE POLICY "Allow admin full access to practical completions"
ON public.cognara_practical_completions FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));
