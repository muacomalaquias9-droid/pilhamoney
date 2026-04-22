import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * security-guard
 * Verifica antes de qualquer login/cadastro:
 * 1. País (apenas Angola — AO)
 * 2. Detecção de VPN/Proxy/Tor
 * 3. IP bloqueado manualmente
 * 4. Brute-force (>5 falhas em 15min por email ou IP)
 * 5. Rate-limit por IP (>20 req/min)
 * Regista a tentativa em login_attempts.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { email, action } = await req.json().catch(() => ({}));
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "0.0.0.0";
    const ua = req.headers.get("user-agent") || "";

    const log = async (success: boolean, reason: string, country?: string) => {
      await supabase.from("login_attempts").insert({
        email: email || null, ip_address: ip, country: country || null,
        success, user_agent: ua, reason,
      });
    };

    // 1. Rate-limit por IP (20/min)
    const { data: rlOk } = await supabase.rpc("check_rate_limit", {
      _key: ip, _action: "auth", _max: 20, _window_seconds: 60,
    });
    if (!rlOk) {
      await log(false, "rate_limit_ip");
      return json({ allowed: false, code: "RATE_LIMIT", message: "Muitos pedidos. Aguarde 1 minuto." }, 429);
    }

    // 2. IP bloqueado?
    const { data: blocked } = await supabase
      .from("blocked_ips").select("*").eq("ip_address", ip).maybeSingle();
    if (blocked && (blocked.permanent || (blocked.blocked_until && new Date(blocked.blocked_until) > new Date()))) {
      await log(false, "ip_blocked");
      return json({ allowed: false, code: "IP_BLOCKED", message: "IP bloqueado por motivos de segurança." }, 403);
    }

    // 3. Geo + VPN check (ip-api.com — gratuito, sem chave)
    let country = "??";
    let isProxy = false;
    try {
      const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,proxy,hosting`);
      const g = await r.json();
      if (g.status === "success") {
        country = g.countryCode || "??";
        isProxy = !!(g.proxy || g.hosting);
      }
    } catch {}

    // Localhost/preview bypass
    const isLocal = ip === "0.0.0.0" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip === "::1";

    if (!isLocal && country !== "AO" && country !== "??") {
      await log(false, `geo_block:${country}`, country);
      return json({ allowed: false, code: "GEO_BLOCK", message: "Acesso permitido apenas em Angola." }, 403);
    }
    if (!isLocal && isProxy) {
      await log(false, "vpn_detected", country);
      return json({ allowed: false, code: "VPN_BLOCK", message: "VPN/Proxy detectado. Desactive para continuar." }, 403);
    }

    // 4. Brute-force por email (>5 falhas em 15min)
    if (email && action === "login") {
      const since = new Date(Date.now() - 15 * 60_000).toISOString();
      const { count } = await supabase.from("login_attempts").select("*", { count: "exact", head: true })
        .eq("email", email).eq("success", false).gte("created_at", since);
      if ((count || 0) >= 5) {
        await log(false, "brute_force_email", country);
        return json({ allowed: false, code: "BRUTE_FORCE", message: "Conta temporariamente bloqueada. Tente daqui a 15 minutos." }, 423);
      }
      const { count: ipCount } = await supabase.from("login_attempts").select("*", { count: "exact", head: true })
        .eq("ip_address", ip).eq("success", false).gte("created_at", since);
      if ((ipCount || 0) >= 10) {
        // Auto-block IP por 1h
        await supabase.from("blocked_ips").upsert({
          ip_address: ip, reason: "Auto: brute-force",
          blocked_until: new Date(Date.now() + 3600_000).toISOString(),
        }, { onConflict: "ip_address" });
        await log(false, "auto_ip_block", country);
        return json({ allowed: false, code: "IP_AUTO_BLOCKED", message: "IP bloqueado por 1 hora." }, 423);
      }
    }

    await log(true, "ok", country);
    return json({ allowed: true, country, ip });
  } catch (e) {
    console.error("security-guard error:", e);
    return json({ allowed: true, error: "guard_failed" }); // fail-open para não derrubar login legítimo
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}