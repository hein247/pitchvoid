-- Add billing and usage columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_interval TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pitch_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pitch_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS team_id UUID,
ADD COLUMN IF NOT EXISTS team_role TEXT;

-- Create teams table for organizational subscriptions
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  seat_count INTEGER DEFAULT 2,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key from profiles.team_id to teams.id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table
-- Team members can view their team
CREATE POLICY "Team members can view their team"
ON public.teams
FOR SELECT
USING (
  id IN (
    SELECT team_id FROM public.profiles WHERE id = auth.uid()
  )
  OR owner_id = auth.uid()
);

-- Team owners can update their team
CREATE POLICY "Team owners can update their team"
ON public.teams
FOR UPDATE
USING (owner_id = auth.uid());

-- Team owners can delete their team
CREATE POLICY "Team owners can delete their team"
ON public.teams
FOR DELETE
USING (owner_id = auth.uid());

-- Users can create teams (they become owner)
CREATE POLICY "Users can create teams"
ON public.teams
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Create index for faster team lookups
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);