
-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Promote both possible admin emails to admin (528 and 582)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN ('isaacmuaco528@gmail.com','isaacmuaco582@gmail.com')
ON CONFLICT DO NOTHING;

-- 3. Security tables: rate limiting, IP/geo blocks, abuse incidents, login attempts
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT,
  country TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read login attempts" ON public.login_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, created_at DESC);

CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ,
  permanent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocked ips" ON public.blocked_ips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.abuse_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  ai_analysis TEXT,
  ai_score INT,
  details JSONB,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.abuse_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read incidents" ON public.abuse_incidents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own incidents" ON public.abuse_incidents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX idx_abuse_user ON public.abuse_incidents(user_id, created_at DESC);

CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  action TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, action, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read rate limits" ON public.rate_limits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_rate_limits_key ON public.rate_limits(key, action, window_start DESC);

-- 4. Helper: rate limit check (security definer)
CREATE OR REPLACE FUNCTION public.check_rate_limit(_key TEXT, _action TEXT, _max INT, _window_seconds INT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  SELECT COALESCE(SUM(count),0) INTO v_count
  FROM public.rate_limits
  WHERE key=_key AND action=_action
    AND window_start > now() - (_window_seconds || ' seconds')::interval;
  IF v_count >= _max THEN RETURN false; END IF;
  INSERT INTO public.rate_limits(key, action, count, window_start)
  VALUES (_key, _action, 1, date_trunc('minute', now()))
  ON CONFLICT (key, action, window_start) DO UPDATE SET count = rate_limits.count + 1;
  RETURN true;
END;
$$;

-- 5. Block account flag on user_security
ALTER TABLE public.user_security ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_security ADD COLUMN IF NOT EXISTS ban_reason TEXT;
