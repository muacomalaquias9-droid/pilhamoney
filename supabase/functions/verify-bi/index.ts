import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { bi_image_url, full_name, birth_date, bi_number } = body;

    if (!bi_image_url || !full_name || !birth_date || !bi_number) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check age (must be 16+)
    const birthDate = new Date(birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return new Response(JSON.stringify({ 
        error: "Você deve ter pelo menos 16 anos para criar uma conta",
        verified: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use AI to verify the BI document
    let aiVerified = false;
    let aiMessage = "";

    if (lovableApiKey) {
      try {
        // Download the BI image to send to AI
        const { data: imageData } = await supabase.storage
          .from("identity-docs")
          .createSignedUrl(`${user.id}/bi.jpg`, 300);

        const imageUrl = imageData?.signedUrl;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Você é um sistema de verificação de identidade angolana. Analise a imagem do Bilhete de Identidade (BI) e verifique:
1. Se o documento é um BI angolano válido
2. Se o nome no BI corresponde ao nome fornecido: "${full_name}"
3. Se o número do BI corresponde: "${bi_number}"

Responda APENAS em JSON com este formato:
{"valid": true/false, "name_matches": true/false, "bi_number_matches": true/false, "reason": "explicação breve"}

Se não conseguir ler a imagem claramente, defina valid como false com a razão.`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: `Verifique este BI angolano. Nome esperado: ${full_name}. Número BI esperado: ${bi_number}.` },
                  ...(imageUrl ? [{ type: "image_url" as const, image_url: { url: imageUrl } }] : []),
                ],
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "verify_bi",
                description: "Verify the BI document",
                parameters: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean", description: "Whether the document appears to be a valid Angolan BI" },
                    name_matches: { type: "boolean", description: "Whether the name on the BI matches the provided name" },
                    bi_number_matches: { type: "boolean", description: "Whether the BI number matches" },
                    reason: { type: "string", description: "Brief explanation" },
                  },
                  required: ["valid", "name_matches", "bi_number_matches", "reason"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "verify_bi" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const result = JSON.parse(toolCall.function.arguments);
            aiVerified = result.valid && result.name_matches;
            aiMessage = result.reason || "";
          }
        }
      } catch (aiErr) {
        console.error("AI verification error:", aiErr);
        // If AI fails, mark as pending for manual review
        aiMessage = "Verificação automática indisponível - pendente revisão manual";
      }
    }

    const verificationStatus = aiVerified ? "approved" : "pending";

    // Update profile with BI data
    await supabase.from("profiles").update({
      birth_date,
      bi_number,
      bi_image_url,
      bi_verified: aiVerified,
      bi_verification_status: verificationStatus,
    }).eq("id", user.id);

    return new Response(JSON.stringify({
      verified: aiVerified,
      status: verificationStatus,
      message: aiVerified
        ? "BI verificado com sucesso! ✅"
        : "BI enviado para verificação. Aguarde aprovação. " + aiMessage,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("BI verification error:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
