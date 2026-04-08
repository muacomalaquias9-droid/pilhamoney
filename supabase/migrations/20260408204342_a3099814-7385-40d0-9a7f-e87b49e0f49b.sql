
DO $$
BEGIN
  -- Remove wallets from realtime if present
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.wallets;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  -- Remove withdrawals from realtime if present
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.withdrawals;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  -- Remove transfers from realtime if present
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.transfers;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;
