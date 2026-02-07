-- Set public_id to default to a random UUID string to prevent enumeration
ALTER TABLE public.projects
  ALTER COLUMN public_id SET DEFAULT gen_random_uuid()::text;

-- Backfill any existing rows that have NULL public_id
UPDATE public.projects
  SET public_id = gen_random_uuid()::text
  WHERE public_id IS NULL;

-- Add a unique constraint to prevent collisions
ALTER TABLE public.projects
  ADD CONSTRAINT projects_public_id_unique UNIQUE (public_id);