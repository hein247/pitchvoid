
-- Change default credits from 10 to 3 for new users
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 3;

-- Update the handle_new_user function to give 3 credits instead of 10
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  INSERT INTO public.profiles (id, full_name, credits, updated_at)
  VALUES (
    NEW.id,
    LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 255),
    3,
    now()
  );
  RETURN NEW;
END;
$function$;
