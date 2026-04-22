import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * support-ai
 * Chat de suporte com IA (Lovable AI Gateway / Gemini).
 * - Recebe ticket_id + mensagem do utilizador.
 * - Carrega histórico das mensagens e estado da conta (banida? motivo? KYC?).
 * - Se conta banida ou ticket exige verificação → cria pedido bi_reverification (10 min).
 * - Se IA detectar violação dos Termos de Angola → mantém bloqueio.
 * - Grava resposta da IA em support_messages.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const { ticket_id, message } = await req.json();
    if (!ticket_id || !message || typeof message !== "string") {
      return json({ error: "Dados inválidos" }, 400);
    }
    if (message.length > 2000) return json({ error: "Mensagem muito longa" }, 400);

    const supabase = createClient(supabaseUrl, serviceKey);

    // Carrega ticket
    const { data: ticket } = await supabase
      .from("support_tickets").select("*").eq("id", ticket_id).maybeSingle();
    if (!ticket || ticket.user_id !== user.id) return json({ error: "Ticket não encontrado" }, 404);

    // Estado da conta
    const { data: sec } = await supabase
      .from("user_security").select("is_banned, ban_reason").eq("user_id", user.id).maybeSingle();
    const { data: profile } = await supabase
      .from("profiles").select("full_name, username, bi_verified, bi_verification_status").eq("id", user.id).maybeSingle();

    // Histórico (últimas 20)
    const { data: history } = await supabase
      .from("support_messages").select("sender, content").eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true }).limit(20);

    // Insere mensagem do utilizador
    await supabase.from("support_messages").insert({
      ticket_id, sender: "user", content: message,
    });

    // Default fallback
    let aiText = "O nosso assistente está temporariamente indisponível. Um humano vai responder em breve.";
    let action = "none";

    if (LOVABLE_API_KEY) {
      const systemPrompt = `És o "Suporte IA Pilha Money" — assistente oficial da carteira Pilha Money em Angola.
REGRAS RIGOROSAS DOS TERMOS DE ANGOLA:
1. Recusa ajudar em fraude, lavagem de dinheiro, evasão fiscal, contas falsas, identidade de outra pessoa.
2. Se o utilizador desrespeita os termos → mantém o bloqueio e explica calmamente.
3. Se a conta está BANIDA por motivo legítimo (fraude, BI falso, múltiplas contas) → mantém banida.
4. Se a conta está banida por engano (falso positivo) → pede o BILHETE DE IDENTIDADE original (frente) + selfie segurando o BI para verificação rigorosa em 10 MINUTOS.
5. Linguagem em português de Angola, simples, directa, máximo 4 frases.
6. Nunca reveles dados internos (RLS, IDs, IPs, scores).

ESTADO DA CONTA:
- Nome: ${profile?.full_name || "?"}
- Username: @${profile?.username || "?"}
- BI verificado: ${profile?.bi_verified ? "sim" : "não"} (status: ${profile?.bi_verification_status || "?"})
- Conta banida: ${sec?.is_banned ? "SIM" : "não"}
- Motivo do banimento: ${sec?.ban_reason || "n/a"}
- Categoria do ticket: ${ticket.category}
- Já requer verificação BI? ${ticket.requires_bi_verification ? "sim" : "não"}

Decide via tool call.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          tools: [{
            type: "function",
            function: {
              name: "respond",
              description: "Resposta para o utilizador e acção a tomar.",
              parameters: {
                type: "object",
                properties: {
                  reply: { type: "string", description: "Resposta em português de Angola, máx 4 frases" },
                  action: {
                    type: "string",
                    enum: ["none", "request_bi_verification", "keep_banned", "escalate_admin", "close_resolved"],
                  },
                  reason: { type: "string", description: "Motivo curto da acção" },
                },
                required: ["reply", "action"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "respond" } },
        }),
      });

      if (r.status === 429) {
        aiText = "Muitos pedidos no momento. Tente daqui a um minuto.";
      } else if (r.status === 402) {
        aiText = "Sem créditos IA. Um humano vai responder em breve.";
      } else if (r.ok) {
        const j = await r.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) {
          const parsed = JSON.parse(args);
          aiText = parsed.reply || aiText;
          action = parsed.action || "none";
        }
      }
    }

    // Aplicar acções
    if (action === "request_bi_verification") {
      // Cria pedido se ainda não existe um pendente válido
      const { data: existing } = await supabase
        .from("bi_reverification_requests")
        .select("id, expires_at, status")
        .eq("ticket_id", ticket_id).eq("status", "pending")
        .maybeSingle();
      if (!existing || new Date(existing.expires_at) < new Date()) {
        await supabase.from("bi_reverification_requests").insert({
          ticket_id, user_id: user.id,
        });
        await supabase.from("support_tickets").update({
          requires_bi_verification: true,
          bi_deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
        }).eq("id", ticket_id);
      }
    } else if (action === "keep_banned") {
      await supabase.from("support_tickets").update({
        status: "closed",
        resolution: "Bloqueio mantido por violação dos Termos de Angola.",
      }).eq("id", ticket_id);
    } else if (action === "escalate_admin") {
      await supabase.from("support_tickets").update({ status: "escalated" }).eq("id", ticket_id);
    } else if (action === "close_resolved") {
      await supabase.from("support_tickets").update({
        status: "resolved", resolution: "Resolvido pela IA",
      }).eq("id", ticket_id);
    }

    // Grava resposta da IA
    await supabase.from("support_messages").insert({
      ticket_id, sender: "ai", content: aiText, metadata: { action },
    });

    return json({ reply: aiText, action });
  } catch (e) {
    console.error("support-ai error:", e);
    return json({ error: "Erro interno" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});