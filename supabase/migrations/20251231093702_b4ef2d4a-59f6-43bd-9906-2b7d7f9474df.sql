-- Update the trigger to allow consent withdrawal but prevent re-giving consent
-- This supports GDPR-style "right to withdraw" while preventing manipulation

CREATE OR REPLACE FUNCTION public.prevent_consent_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow withdrawing consent (true -> false)
  -- But prevent giving consent again after withdrawal via direct UPDATE
  -- (They must leave and rejoin the session to give consent again)
  IF OLD.consent_given = false AND NEW.consent_given = true THEN
    RAISE EXCEPTION 'Cannot re-enable consent after withdrawal. Please rejoin the session.';
  END IF;
  
  RETURN NEW;
END;
$$;