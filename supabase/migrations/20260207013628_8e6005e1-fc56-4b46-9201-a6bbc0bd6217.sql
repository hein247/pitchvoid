
-- Add status and draft_state columns to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS draft_state jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS output_format text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS output_data jsonb DEFAULT NULL;

-- Create project_versions table to store last 3 versions per project
CREATE TABLE public.project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  output_format text NOT NULL,
  output_data jsonb NOT NULL,
  generation_context jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_project_versions_created ON public.project_versions(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view versions of their own projects
CREATE POLICY "Users can view versions of own projects"
ON public.project_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_versions.project_id
  AND projects.user_id = auth.uid()
));

-- RLS: Users can insert versions for their own projects
CREATE POLICY "Users can insert versions for own projects"
ON public.project_versions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_versions.project_id
  AND projects.user_id = auth.uid()
));

-- RLS: Users can delete versions of their own projects
CREATE POLICY "Users can delete versions of own projects"
ON public.project_versions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_versions.project_id
  AND projects.user_id = auth.uid()
));

-- Function to enforce max 3 versions per project (auto-prune oldest)
CREATE OR REPLACE FUNCTION public.prune_old_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.project_versions
  WHERE id IN (
    SELECT id FROM public.project_versions
    WHERE project_id = NEW.project_id
    ORDER BY created_at DESC
    OFFSET 3
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_prune_old_versions
AFTER INSERT ON public.project_versions
FOR EACH ROW
EXECUTE FUNCTION public.prune_old_versions();
