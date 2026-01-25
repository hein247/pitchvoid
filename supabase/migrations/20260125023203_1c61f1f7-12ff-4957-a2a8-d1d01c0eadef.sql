-- Add published flag and public_id to projects table for shareable links
ALTER TABLE public.projects 
ADD COLUMN is_published BOOLEAN DEFAULT false,
ADD COLUMN public_id TEXT UNIQUE;

-- Create index for faster public lookups
CREATE INDEX idx_projects_public_id ON public.projects(public_id) WHERE public_id IS NOT NULL;

-- Create RLS policy for public access to published projects
CREATE POLICY "Anyone can view published projects"
ON public.projects
FOR SELECT
USING (is_published = true AND public_id IS NOT NULL);

-- Allow public read access to slides of published projects
CREATE POLICY "Anyone can view slides of published projects"
ON public.slides
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = slides.project_id 
    AND projects.is_published = true 
    AND projects.public_id IS NOT NULL
  )
);

-- Add layout_type column to slides table for template support
ALTER TABLE public.slides
ADD COLUMN layout_type TEXT DEFAULT 'centered';