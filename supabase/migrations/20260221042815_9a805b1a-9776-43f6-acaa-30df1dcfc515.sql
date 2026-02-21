
-- Create output_versions table
CREATE TABLE public.output_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  output_json jsonb NOT NULL,
  trigger text NOT NULL,
  format text NOT NULL CHECK (format IN ('one-pager', 'script')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.output_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own output versions"
  ON public.output_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own output versions"
  ON public.output_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own output versions"
  ON public.output_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-prune function: keep max 3 per project_id + format
CREATE OR REPLACE FUNCTION public.enforce_max_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.output_versions
  WHERE id IN (
    SELECT id FROM public.output_versions
    WHERE project_id = NEW.project_id AND format = NEW.format
    ORDER BY created_at DESC
    OFFSET 3
  );
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trg_enforce_max_versions
  AFTER INSERT ON public.output_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_versions();
