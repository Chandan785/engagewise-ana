-- =====================================================
-- FIX 1: Engagement metrics - Require consent for INSERT
-- =====================================================

-- Drop and recreate INSERT policy with consent check
DROP POLICY IF EXISTS "Participants can insert their own metrics" ON public.engagement_metrics;

CREATE POLICY "Participants can insert metrics only with consent"
ON public.engagement_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.participants p
    WHERE p.id = engagement_metrics.participant_id
      AND p.user_id = auth.uid()
      AND p.consent_given = true
  )
);

-- =====================================================
-- FIX 2: Restrict participants UPDATE to only left_at field
-- =====================================================
-- Note: RLS policies work at row level, not column level
-- We'll use a trigger to prevent consent field manipulation

CREATE OR REPLACE FUNCTION public.prevent_consent_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing consent_given once it's been set
  IF OLD.consent_given = true AND NEW.consent_given = false THEN
    RAISE EXCEPTION 'Cannot revoke consent after it has been given';
  END IF;
  
  -- Prevent changing consent_given_at if consent was already given
  IF OLD.consent_given_at IS NOT NULL AND NEW.consent_given_at IS DISTINCT FROM OLD.consent_given_at THEN
    RAISE EXCEPTION 'Cannot modify consent timestamp';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS prevent_consent_manipulation_trigger ON public.participants;
CREATE TRIGGER prevent_consent_manipulation_trigger
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_consent_manipulation();