-- Drop the existing policy that exposes emails to hosts
DROP POLICY IF EXISTS "Hosts can view participant profiles in their sessions" ON public.profiles;

-- Create a secure view for hosts to see limited participant info (no email)
CREATE OR REPLACE VIEW public.participant_profiles_limited AS
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

-- The view inherits RLS from the underlying tables, but we also need 
-- to ensure users can still see their own full profile
-- The existing "Users can view their own profile" policy handles this