-- Create target function to recalculate a user's XP and Level based on history
CREATE OR REPLACE FUNCTION public.recalculate_xp(target_user_id uuid)
RETURNS json AS $$
DECLARE
  completed_lessons_count integer;
  quiz_attempts_count integer;
  quiz_passes_count integer;
  perfect_quizzes_count integer;
  total_xp integer;
  calculated_level integer;
BEGIN
  -- Count completed lessons (+100 XP each)
  SELECT count(*) INTO completed_lessons_count
  FROM public.lesson_progress
  WHERE user_id = target_user_id AND status = 'completed';

  -- Count quiz attempts (+50 XP each)
  SELECT count(*) INTO quiz_attempts_count
  FROM public.quiz_attempts
  WHERE user_id = target_user_id;

  -- Count quiz passes (+150 XP each)
  SELECT count(*) INTO quiz_passes_count
  FROM public.quiz_attempts
  WHERE user_id = target_user_id AND passed = true;

  -- Count perfect score quizzes (+50 XP bonus each)
  SELECT count(*) INTO perfect_quizzes_count
  FROM public.quiz_attempts
  WHERE user_id = target_user_id AND score = 100;

  -- Calculate cumulative XP
  total_xp := (COALESCE(completed_lessons_count, 0) * 100) + 
              (COALESCE(quiz_attempts_count, 0) * 50) + 
              (COALESCE(quiz_passes_count, 0) * 150) + 
              (COALESCE(perfect_quizzes_count, 0) * 50);

  -- Calculate Level based on progression curve: 50 * L * (L + 1)
  calculated_level := 1;
  WHILE total_xp >= 50 * calculated_level * (calculated_level + 1) LOOP
    calculated_level := calculated_level + 1;
  END LOOP;

  -- Update profiles columns
  UPDATE public.profiles
  SET xp = COALESCE(total_xp, 0), level = COALESCE(calculated_level, 1)
  WHERE id = target_user_id;

  RETURN json_build_object(
    'xp', total_xp,
    'level', calculated_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the recalculation loop for all existing profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalculate_xp(r.id);
  END LOOP;
END;
$$;
