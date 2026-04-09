
-- Savings vaults
CREATE TABLE public.savings_vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu Cofre',
  goal_amount integer NOT NULL DEFAULT 0,
  current_amount integer NOT NULL DEFAULT 0,
  deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vaults" ON public.savings_vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own vaults" ON public.savings_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vaults" ON public.savings_vaults FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vaults" ON public.savings_vaults FOR DELETE USING (auth.uid() = user_id);

-- Admin function to process withdrawal (approve/reject)
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id uuid,
  p_action text,
  p_admin_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_result json;
BEGIN
  IF p_admin_email != 'isaacmuaco528@gmail.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Saque não encontrado ou já processado');
  END IF;

  IF p_action = 'approve' THEN
    -- Check balance
    IF (SELECT balance FROM wallets WHERE user_id = v_withdrawal.user_id) < v_withdrawal.amount THEN
      RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
    END IF;

    -- Deduct balance
    UPDATE wallets SET balance = balance - v_withdrawal.amount, updated_at = now() WHERE user_id = v_withdrawal.user_id;
    UPDATE withdrawals SET status = 'approved', processed_at = now() WHERE id = p_withdrawal_id;
    RETURN json_build_object('success', true, 'status', 'approved');

  ELSIF p_action = 'reject' THEN
    UPDATE withdrawals SET status = 'rejected', processed_at = now() WHERE id = p_withdrawal_id;
    RETURN json_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Acção inválida');
  END IF;
END;
$$;
