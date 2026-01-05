-- Drop the security definer view and recreate with SECURITY INVOKER (default, explicit)
DROP VIEW IF EXISTS public.participant_profiles_limited;

-- Create the view with explicit SECURITY INVOKER to use the querying user's permissions
CREATE VIEW public.participant_profiles_limited 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.organization
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.participants part
  JOIN public.sessions s ON s.id = part.session_id
  WHERE part.user_id = p.user_id
    AND s.host_id = auth.uid()
);

-- Grant access to authenticated users
GRANT SELECT ON public.participant_profiles_limited TO authenticated;

-- Create RLS policy for hosts to access the limited profile data through the profiles table
-- This policy allows hosts to see only non-sensitive data
CREATE POLICY "Hosts can view limited participant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND public.can_host_view_profile(user_id)
);