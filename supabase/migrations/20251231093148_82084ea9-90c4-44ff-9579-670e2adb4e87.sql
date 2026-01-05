-- =====================================================
-- FIX 1: Profiles table - Tighten SELECT policies
-- =====================================================

-- Drop existing SELECT policies and recreate with stricter conditions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can ONLY view their own profile (strict auth check)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- FIX 2: Profiles table - Add INSERT/DELETE protection
-- =====================================================

-- Profiles are created by the handle_new_user trigger (SECURITY DEFINER)
-- No direct INSERT should be allowed from clients
CREATE POLICY "Deny direct profile inserts"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Profiles should not be deleted by users - only by admin processes
CREATE POLICY "Deny profile deletion"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- =====================================================
-- FIX 3: Engagement metrics - Add consent requirement
-- =====================================================

-- Drop and recreate the host view policy to require participant consent
DROP POLICY IF EXISTS "Hosts can view metrics for their sessions" ON public.engagement_metrics;

-- Hosts can only view metrics for participants who have given consent
CREATE POLICY "Hosts can view metrics for consenting participants"
ON public.engagement_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participants p
    JOIN public.sessions s ON s.id = p.session_id
    WHERE p.id = engagement_metrics.participant_id
      AND s.host_id = auth.uid()
      AND p.consent_given = true
  )
);