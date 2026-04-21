-- 1) Lock down donations: remove public select, allow only recipient
DROP POLICY IF EXISTS "Donations are publicly viewable" ON public.donations;

CREATE POLICY "Recipients can view own donations"
ON public.donations FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- 2) Public count function (no PII exposure)
CREATE OR REPLACE FUNCTION public.get_donation_count(p_recipient_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.donations
  WHERE recipient_id = p_recipient_id AND status = 'completed';
$$;

GRANT EXECUTE ON FUNCTION public.get_donation_count(uuid) TO anon, authenticated;

-- 3) Remove donations from realtime publication to stop live PII leak
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'donations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.donations';
  END IF;
END$$;

-- 4) Block client-side inserts on transfers (only edge functions w/ service role can write)
DROP POLICY IF EXISTS "Users can insert own transfers" ON public.transfers;