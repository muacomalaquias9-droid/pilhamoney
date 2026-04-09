import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base32Encode, decode as base32Decode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

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

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(sig);
}

async function generateTOTP(secret: string, timeOffset = 0): Promise<string> {
  const period = 30;
  const counter = Math.floor((Date.now() / 1000 + timeOffset) / period);

  // Convert counter to 8-byte big-endian buffer
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);

  // Decode base32 secret
  let secretBytes: Uint8Array;
  try {
    // Pad the secret to multiple of 8 for base32
    let padded = secret.toUpperCase();
    while (padded.length % 8 !== 0) padded += "=";
    secretBytes = base32Decode(padded);
  } catch {
    throw new Error("Invalid TOTP secret");
  }

  const hmac = await hmacSha1(secretBytes, new Uint8Array(buf));

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1000000).padStart(6, "0");
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
    const action = body.action;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "setup") {
      const secret = generateSecret();

      await supabase.from("user_security").upsert({
        user_id: user.id,
        totp_secret: secret,
        totp_enabled: false,
      }, { onConflict: "user_id" });

      const otpAuthUrl = `otpauth://totp/PilhaMoney:${user.email}?secret=${secret}&issuer=PilhaMoney&algorithm=SHA1&digits=6&period=30`;

      return new Response(JSON.stringify({ secret, otpauth_url: otpAuthUrl }), {
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

      // Get secret and verify the code actually works before enabling
      const { data: sec } = await supabase.from("user_security")
        .select("totp_secret").eq("user_id", user.id).maybeSingle();

      if (!sec?.totp_secret) {
        return new Response(JSON.stringify({ error: "Configure o 2FA primeiro" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify code with current and previous window
      const current = await generateTOTP(sec.totp_secret, 0);
      const prev = await generateTOTP(sec.totp_secret, -30);
      const next = await generateTOTP(sec.totp_secret, 30);

      if (code !== current && code !== prev && code !== next) {
        return new Response(JSON.stringify({ error: "Código inválido. Verifique o app autenticador." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      if (sec.locked_until && new Date(sec.locked_until) > new Date()) {
        return new Response(JSON.stringify({ error: "Conta bloqueada. Tente novamente mais tarde." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify with 3 windows (prev, current, next)
      const current = await generateTOTP(sec.totp_secret, 0);
      const prev = await generateTOTP(sec.totp_secret, -30);
      const next = await generateTOTP(sec.totp_secret, 30);

      if (code === current || code === prev || code === next) {
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
