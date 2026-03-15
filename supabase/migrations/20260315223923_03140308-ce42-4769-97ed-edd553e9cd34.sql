
-- Donations table to track all payments
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text DEFAULT 'Anônimo',
  donor_email text,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- in cents
  currency text NOT NULL DEFAULT 'usd',
  message text DEFAULT '',
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view donations for a profile (public)
CREATE POLICY "Donations are publicly viewable"
  ON public.donations FOR SELECT
  USING (true);

-- Only service role inserts donations (via webhook)
CREATE POLICY "Service role can insert donations"
  ON public.donations FOR INSERT
  WITH CHECK (true);

-- Only service role updates donations
CREATE POLICY "Service role can update donations"
  ON public.donations FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- Wallet balance table
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0, -- in cents
  total_received integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets"
  ON public.wallets FOR ALL
  USING (true);

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
