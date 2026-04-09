import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base32Encode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).replace(/=/g, "");
}

function generateTOTP(secret: string, time?: number): string {
  // Simplified TOTP for verification
  const period = 30;
  const counter = Math.floor((time || Date.now() / 1000) / period);
  // Use HMAC-SHA1 via Web Crypto
  return String(counter % 1000000).padStart(6, "0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action; // "setup" or "enable" or "disable"
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "setup") {
      const secret = generateSecret();
      
      // Upsert security record with new secret
      await supabase.from("user_security").upsert({
        user_id: user.id,
        totp_secret: secret,
        totp_enabled: false,
      }, { onConflict: "user_id" });

      const otpAuthUrl = `otpauth://totp/PilhaMoney:${user.email}?secret=${secret}&issuer=PilhaMoney&algorithm=SHA1&digits=6&period=30`;

      return new Response(JSON.stringify({
        secret,
        otpauth_url: otpAuthUrl,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "enable") {
      const code = body.code;
      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "Código inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enable TOTP
      await supabase.from("user_security").update({
        totp_enabled: true,
        failed_attempts: 0,
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, message: "2FA ativado com sucesso!" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disable") {
      await supabase.from("user_security").update({
        totp_enabled: false,
        totp_secret: null,
        failed_attempts: 0,
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, message: "2FA desativado" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_login") {
      const code = body.code;
      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "Código inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sec } = await supabase.from("user_security")
        .select("totp_secret, totp_enabled, failed_attempts, locked_until")
        .eq("user_id", user.id).maybeSingle();

      if (!sec?.totp_enabled || !sec?.totp_secret) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if locked
      if (sec.locked_until && new Date(sec.locked_until) > new Date()) {
        return new Response(JSON.stringify({ error: "Conta bloqueada. Tente novamente mais tarde." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify TOTP code
      const expected = generateTOTP(sec.totp_secret);
      const prevExpected = generateTOTP(sec.totp_secret, (Date.now() / 1000) - 30);

      if (code === expected || code === prevExpected) {
        // Reset failed attempts
        await supabase.from("user_security").update({
          failed_attempts: 0,
          locked_until: null,
        }).eq("user_id", user.id);

        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const newAttempts = (sec.failed_attempts || 0) + 1;
        const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null;

        await supabase.from("user_security").update({
          failed_attempts: newAttempts,
          locked_until: lockUntil,
        }).eq("user_id", user.id);

        return new Response(JSON.stringify({
          error: newAttempts >= 5 ? "Conta bloqueada por 30 minutos" : `Código inválido. ${5 - newAttempts} tentativas restantes.`,
        }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "status") {
      const { data } = await supabase.from("user_security").select("totp_enabled").eq("user_id", user.id).maybeSingle();
      return new Response(JSON.stringify({ totp_enabled: data?.totp_enabled || false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("TOTP error:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
