-- Add image_url and visual_style columns to slides table
ALTER TABLE public.slides 
ADD COLUMN image_url TEXT,
ADD COLUMN visual_style TEXT;