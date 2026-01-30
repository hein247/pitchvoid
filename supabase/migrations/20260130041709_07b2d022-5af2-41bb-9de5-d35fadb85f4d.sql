-- Drop the old view and recreate with security_invoker
DROP VIEW IF EXISTS public.team_info_safe;

-- Recreate the view with security_invoker=on to respect RLS
CREATE VIEW public.team_info_safe
WITH (security_invoker = on) AS
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