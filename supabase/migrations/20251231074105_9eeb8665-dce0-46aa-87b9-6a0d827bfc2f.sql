-- Deny all anonymous access to profiles table
CREATE POLICY "deny_anonymous_access"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Also deny anonymous access to engagement_metrics table
CREATE POLICY "deny_anonymous_access"
ON public.engagement_metrics
FOR ALL
TO anon
USING (false);

-- And deny anonymous access to sessions table
CREATE POLICY "deny_anonymous_access"
ON public.sessions
FOR ALL
TO anon
USING (false);

-- Deny anonymous access to participants table
CREATE POLICY "deny_anonymous_access"
ON public.participants
FOR ALL
TO anon
USING (false);

-- Deny anonymous access to session_reports table
CREATE POLICY "deny_anonymous_access"
ON public.session_reports
FOR ALL
TO anon
USING (false);

-- Deny anonymous access to user_roles table
CREATE POLICY "deny_anonymous_access"
ON public.user_roles
FOR ALL
TO anon
USING (false);