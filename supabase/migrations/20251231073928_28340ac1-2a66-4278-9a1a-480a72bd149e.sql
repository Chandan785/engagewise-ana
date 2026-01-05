-- Fix 1: Profiles table - Ensure only authenticated users can access profiles
-- Drop the existing policies and recreate with proper restrictions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hosts can view participant profiles in their sessions" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Hosts can view profiles of participants in their sessions (uses security definer function)
CREATE POLICY "Hosts can view participant profiles in their sessions"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_host_view_profile(user_id));

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Engagement metrics - Ensure only hosts and the specific participant can access
DROP POLICY IF EXISTS "Hosts can view metrics for their sessions" ON public.engagement_metrics;
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.engagement_metrics;
DROP POLICY IF EXISTS "Participants can insert their own metrics" ON public.engagement_metrics;

-- Hosts can view metrics for sessions they host
CREATE POLICY "Hosts can view metrics for their sessions"
ON public.engagement_metrics
FOR SELECT
TO authenticated
USING (public.is_session_host(session_id));

-- Participants can only view their own metrics
CREATE POLICY "Users can view their own metrics"
ON public.engagement_metrics
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.participants
  WHERE participants.id = engagement_metrics.participant_id
    AND participants.user_id = auth.uid()
));

-- Participants can only insert their own metrics
CREATE POLICY "Participants can insert their own metrics"
ON public.engagement_metrics
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.participants
  WHERE participants.id = engagement_metrics.participant_id
    AND participants.user_id = auth.uid()
));

-- Fix 3: Sessions table - Restrict access to meeting links
DROP POLICY IF EXISTS "Authenticated users can view active sessions by link" ON public.sessions;
DROP POLICY IF EXISTS "Hosts can manage their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Participants can view sessions they're part of" ON public.sessions;

-- Hosts can manage their own sessions
CREATE POLICY "Hosts can manage their own sessions"
ON public.sessions
FOR ALL
TO authenticated
USING (auth.uid() = host_id);

-- Participants can only view sessions they're explicitly part of
CREATE POLICY "Participants can view sessions they are part of"
ON public.sessions
FOR SELECT
TO authenticated
USING (public.is_participant_in_session(id));

-- Create a function to check if user has valid join access (via direct link)
CREATE OR REPLACE FUNCTION public.can_join_session(session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sessions
    WHERE id = session_id
      AND status = 'active'
  ) AND auth.uid() IS NOT NULL
$$;

-- Allow authenticated users to view ONLY basic session info (not meeting_link) for joining
-- This is handled by the participant policy - users must be added as participants first