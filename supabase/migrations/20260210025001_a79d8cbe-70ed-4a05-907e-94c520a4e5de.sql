
CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating IN ('up', 'down')),
  issues text[] DEFAULT '{}',
  generated_output jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
ON public.ai_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.ai_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
ON public.ai_feedback FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
ON public.ai_feedback FOR DELETE
USING (auth.uid() = user_id);
