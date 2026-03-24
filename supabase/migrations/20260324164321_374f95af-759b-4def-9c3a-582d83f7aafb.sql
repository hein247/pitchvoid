ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS detected_mode text,
  ADD COLUMN IF NOT EXISTS detected_context text,
  ADD COLUMN IF NOT EXISTS mode_confidence text;