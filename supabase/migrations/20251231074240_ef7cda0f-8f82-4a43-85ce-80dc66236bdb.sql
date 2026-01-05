-- Drop the existing deny_anonymous_access policies and recreate with proper blocking
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.profiles;
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.engagement_metrics;
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.sessions;
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.participants;
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.session_reports;
DROP POLICY IF EXISTS "deny_anonymous_access" ON public.user_roles;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well (extra security)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.participants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.session_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Update existing SELECT policies to require authentication
-- Profiles: Drop and recreate with auth check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hosts can view participant profiles in their sessions" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Hosts can view participant profiles in their sessions"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND public.can_host_view_profile(user_id));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);