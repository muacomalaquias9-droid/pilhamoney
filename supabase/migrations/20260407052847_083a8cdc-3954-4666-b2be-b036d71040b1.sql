
-- Create transfers table for internal transfers
CREATE TABLE public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  note text DEFAULT '',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers where they are sender or receiver
CREATE POLICY "Users can view own transfers"
ON public.transfers FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert transfers where they are sender
CREATE POLICY "Users can insert own transfers"
ON public.transfers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND status = 'completed');

-- Create user_security table for 2FA
CREATE TABLE public.user_security (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  daily_transfer_limit integer NOT NULL DEFAULT 500000,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Users can only view their own security settings
CREATE POLICY "Users can view own security"
ON public.user_security FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for transfers
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;
