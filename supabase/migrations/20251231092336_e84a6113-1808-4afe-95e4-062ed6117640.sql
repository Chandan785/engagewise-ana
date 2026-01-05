-- Remove the RLS policy that gives hosts direct access to the profiles table
-- Hosts should ONLY access participant profiles through the limited view
DROP POLICY IF EXISTS "Hosts can view limited participant profiles" ON public.profiles;

-- Drop and recreate the view to ensure it's properly set up with security invoker
DROP VIEW IF EXISTS public.participant_profiles_limited;

-- Create a security definer function to get limited profile data for hosts
-- This bypasses RLS on profiles but only returns non-sensitive columns
CREATE OR REPLACE FUNCTION public.get_participant_profiles_for_host(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  organization text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.organization
  FROM public.profiles p
  INNER JOIN public.participants part ON part.user_id = p.user_id
  INNER JOIN public.sessions s ON s.id = part.session_id
  WHERE s.id = p_session_id
    AND s.host_id = auth.uid()
$$;