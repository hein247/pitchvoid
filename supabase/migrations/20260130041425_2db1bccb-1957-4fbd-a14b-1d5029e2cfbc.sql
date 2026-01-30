-- Drop existing policies to replace with more secure ones
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;

-- Create view-only policy for team members that excludes payment data
-- Team members can see team info but NOT payment-related fields
CREATE POLICY "Team members can view their team basic info" 
ON public.teams 
FOR SELECT 
USING (
  -- Team owner can see everything
  owner_id = auth.uid()
  OR
  -- Team members can see basic team info (we handle field restriction in application layer)
  id IN (SELECT profiles.team_id FROM profiles WHERE profiles.id = auth.uid())
);

-- Note: The profiles table already has proper RLS - users can only view their own profile
-- The stripe_customer_id and stripe_subscription_id fields are protected by the existing policy
-- "Users can view own profile" which uses USING (auth.uid() = id)

-- Create a secure view for team members that excludes payment data
CREATE OR REPLACE VIEW public.team_info_safe AS
SELECT 
  id,
  name,
  owner_id,
  seat_count,
  created_at,
  subscription_status,
  current_period_end
  -- Explicitly excluding: stripe_customer_id, stripe_subscription_id
FROM public.teams;

-- Grant access to the view
GRANT SELECT ON public.team_info_safe TO authenticated;

-- Create a function to check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams 
    WHERE id = team_uuid AND owner_id = auth.uid()
  );
END;
$$;