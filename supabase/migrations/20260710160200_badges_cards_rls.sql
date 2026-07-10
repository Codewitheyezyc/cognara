-- RLS policies for cognara_streak_badges
DROP POLICY IF EXISTS "Allow users to read their own streak badges" ON public.cognara_streak_badges;
CREATE POLICY "Allow users to read their own streak badges"
ON public.cognara_streak_badges FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own streak badges" ON public.cognara_streak_badges;
CREATE POLICY "Allow users to insert their own streak badges"
ON public.cognara_streak_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to streak badges" ON public.cognara_streak_badges;
CREATE POLICY "Allow admin full access to streak badges"
ON public.cognara_streak_badges FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));

-- RLS policies for cognara_progress_cards
DROP POLICY IF EXISTS "Allow users to read their own progress cards" ON public.cognara_progress_cards;
CREATE POLICY "Allow users to read their own progress cards"
ON public.cognara_progress_cards FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own progress cards" ON public.cognara_progress_cards;
CREATE POLICY "Allow users to insert their own progress cards"
ON public.cognara_progress_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to progress cards" ON public.cognara_progress_cards;
CREATE POLICY "Allow admin full access to progress cards"
ON public.cognara_progress_cards FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));

-- RLS policies for cognara_pending_awards
DROP POLICY IF EXISTS "Allow users to read their own pending awards" ON public.cognara_pending_awards;
CREATE POLICY "Allow users to read their own pending awards"
ON public.cognara_pending_awards FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own pending awards" ON public.cognara_pending_awards;
CREATE POLICY "Allow users to insert their own pending awards"
ON public.cognara_pending_awards FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own pending awards" ON public.cognara_pending_awards;
CREATE POLICY "Allow users to update their own pending awards"
ON public.cognara_pending_awards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to pending awards" ON public.cognara_pending_awards;
CREATE POLICY "Allow admin full access to pending awards"
ON public.cognara_pending_awards FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));

-- RLS policies for cognara_spark_usage
DROP POLICY IF EXISTS "Allow users to read their own spark usage" ON public.cognara_spark_usage;
CREATE POLICY "Allow users to read their own spark usage"
ON public.cognara_spark_usage FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own spark usage" ON public.cognara_spark_usage;
CREATE POLICY "Allow users to insert their own spark usage"
ON public.cognara_spark_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own spark usage" ON public.cognara_spark_usage;
CREATE POLICY "Allow users to update their own spark usage"
ON public.cognara_spark_usage FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to spark usage" ON public.cognara_spark_usage;
CREATE POLICY "Allow admin full access to spark usage"
ON public.cognara_spark_usage FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));

-- RLS policies for cognara_cancellation_reasons
DROP POLICY IF EXISTS "Allow users to read their own cancellation reasons" ON public.cognara_cancellation_reasons;
CREATE POLICY "Allow users to read their own cancellation reasons"
ON public.cognara_cancellation_reasons FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own cancellation reasons" ON public.cognara_cancellation_reasons;
CREATE POLICY "Allow users to insert their own cancellation reasons"
ON public.cognara_cancellation_reasons FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to cancellation reasons" ON public.cognara_cancellation_reasons;
CREATE POLICY "Allow admin full access to cancellation reasons"
ON public.cognara_cancellation_reasons FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (subscription_tier = 'admin' OR id::text = '4c1fbae5-c423-42e7-8394-1112fe00d42e')));
