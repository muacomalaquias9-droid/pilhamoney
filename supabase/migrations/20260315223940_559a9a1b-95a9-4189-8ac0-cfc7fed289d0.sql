
-- Drop overly permissive policies
DROP POLICY "Service role can insert donations" ON public.donations;
DROP POLICY "Service role can update donations" ON public.donations;
DROP POLICY "Service role can manage wallets" ON public.wallets;

-- Donations: only authenticated users can insert (for checkout creation)
CREATE POLICY "Anon can insert donations for checkout"
  ON public.donations FOR INSERT
  WITH CHECK (status = 'pending');

-- Only the recipient can see their own donations or it's completed (public page)
-- Keep existing select policy as is (public view is intentional)

-- Wallets: no direct client insert/update (service role bypasses RLS)
-- No INSERT/UPDATE policies needed since edge functions use service role
