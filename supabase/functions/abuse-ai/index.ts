import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * abuse-ai — "Admin IA"
 * Recebe um evento (transferência rápida, múltiplos cliques, login estranho, etc.)
 * pergunta à IA (Lovable AI Gateway / Gemini) o nível de risco 0-100,
 * grava em abuse_incidents e bane a conta se score >= 85.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    const { user_id, ip_address, incident_type, details } = await req.json();

    let aiScore = 30;
    let aiAnalysis = "Sem análise IA (chave em falta).";

    if (LOVABLE_API_KEY) {
      const prompt = `És o Admin IA da carteira Pilha-Money (Angola). Analisa este evento e devolve um score de risco 0-100 e uma justificação curta em português.
Evento: ${incident_type}
IP: ${ip_address}
Detalhes: ${JSON.stringify(details)}
Responde apenas via tool call.`;

      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "report_risk",
              description: "Reporta risco e acção",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  analysis: { type: "string" },
                  recommended_action: { type: "string", enum: ["allow", "warn", "rate_limit", "ban"] },
                },
                required: ["score", "analysis", "recommended_action"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_risk" } },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) {
          const parsed = JSON.parse(args);
          aiScore = parsed.score ?? 30;
          aiAnalysis = `${parsed.analysis} [acção: ${parsed.recommended_action}]`;
        }
      }
    }

    let actionTaken = "logged";
    if (aiScore >= 85 && user_id) {
      await supabase.from("user_security").update({
        is_banned: true,
        ban_reason: `Banido pelo Admin IA (score ${aiScore}): ${aiAnalysis.slice(0, 200)}`,
      }).eq("user_id", user_id);
      actionTaken = "user_banned";
    } else if (aiScore >= 60 && ip_address) {
      await supabase.from("blocked_ips").upsert({
        ip_address,
        reason: `Admin IA score ${aiScore}`,
        blocked_until: new Date(Date.now() + 3600_000).toISOString(),
      }, { onConflict: "ip_address" });
      actionTaken = "ip_blocked_1h";
    }

    await supabase.from("abuse_incidents").insert({
      user_id: user_id || null, ip_address: ip_address || null,
      incident_type, severity: aiScore >= 85 ? "critical" : aiScore >= 60 ? "high" : aiScore >= 30 ? "medium" : "low",
      ai_analysis: aiAnalysis, ai_score: aiScore, details: details || {}, action_taken: actionTaken,
    });

    return new Response(JSON.stringify({ score: aiScore, analysis: aiAnalysis, action: actionTaken }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("abuse-ai error:", e);
    return new Response(JSON.stringify({ error: "ai_failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});