-- Add RLS policy for team_info_safe view
-- This view excludes payment data and should be accessible to team members

-- First, ensure RLS is enabled on the view (it inherits from base table with security_invoker=on)
-- The view already uses security_invoker=on, so it respects the base table's RLS policies

-- Create a policy that allows team members to access their team's safe info
-- Note: Views with security_invoker=on use the querying user's permissions,
-- so the existing teams table policies will apply

-- However, we need to grant explicit access to authenticated users
GRANT SELECT ON public.team_info_safe TO authenticated;
GRANT SELECT ON public.team_info_safe TO anon;