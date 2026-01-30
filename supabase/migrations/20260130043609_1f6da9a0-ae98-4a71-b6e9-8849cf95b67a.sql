-- Create rate_limits table for persistent rate limiting across function instances
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (but allow edge functions with service role to access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - this table is only accessed by edge functions using service role key
-- The service role bypasses RLS

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_reset_time ON public.rate_limits(reset_time);

-- Create function to clean up expired rate limit entries (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits WHERE reset_time < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;