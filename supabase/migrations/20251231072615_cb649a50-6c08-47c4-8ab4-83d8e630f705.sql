-- Create security definer functions to prevent RLS recursion

-- Function to check if current user is a host of a session
CREATE OR REPLACE FUNCTION public.is_session_host(session_id uuid)
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
      AND host_id = auth.uid()
  )
$$;

-- Function to check if current user is a participant in a session
CREATE OR REPLACE FUNCTION public.is_participant_in_session(session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participants
    WHERE session_id = is_participant_in_session.session_id
      AND user_id = auth.uid()
  )
$$;

-- Function to check if current user hosts any session with this user as participant
CREATE OR REPLACE FUNCTION public.can_host_view_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.participants p ON p.session_id = s.id
    WHERE s.host_id = auth.uid()
      AND p.user_id = profile_user_id
  )
$$;

-- Drop and recreate problematic policies

-- Fix profiles policies
DROP POLICY IF EXISTS "Hosts can view participant profiles in their sessions" ON public.profiles;
CREATE POLICY "Hosts can view participant profiles in their sessions"
ON public.profiles
FOR SELECT
USING (public.can_host_view_profile(user_id));

-- Fix participants policies  
DROP POLICY IF EXISTS "Hosts can manage participants in their sessions" ON public.participants;
CREATE POLICY "Hosts can manage participants in their sessions"
ON public.participants
FOR ALL
USING (public.is_session_host(session_id));

-- Fix sessions policies
DROP POLICY IF EXISTS "Participants can view sessions they're part of" ON public.sessions;
CREATE POLICY "Participants can view sessions they're part of"
ON public.sessions
FOR SELECT
USING (public.is_participant_in_session(id));