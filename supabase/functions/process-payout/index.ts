import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "isaacmuaco528@gmail.com";
const FEE_PERCENT = 0.03; // 3% fee

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const plinqApiKey = Deno.env.get("PLINQPAY_SECRET_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { withdrawal_id, action } = body;

    if (!withdrawal_id || !action) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process via RPC first (validates balance, updates status)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("process_withdrawal", {
      p_withdrawal_id: withdrawal_id,
      p_action: action,
      p_admin_email: ADMIN_EMAIL,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = rpcResult as any;
    if (!result?.success) {
      return new Response(JSON.stringify({ error: result?.error || "Erro" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If approved, trigger PlinqPay payout
    if (action === "approve" && plinqApiKey) {
      const { data: withdrawal } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawal_id)
        .single();

      if (withdrawal) {
        try {
          const methodDetail = JSON.parse(withdrawal.method_detail);
          const grossAmount = withdrawal.amount;
          const fee = Math.round(grossAmount * FEE_PERCENT);
          const netAmount = grossAmount - fee;

          // Call PlinqPay payout API
          const payoutPayload = {
            externalId: withdrawal.id,
            amount: netAmount,
            method: "IBAN",
            recipient: {
              name: methodDetail.full_name,
              iban: methodDetail.iban,
              bi: methodDetail.bi,
            },
            callbackUrl: `${supabaseUrl}/functions/v1/plinqpay-webhook`,
          };

          console.log("PlinqPay payout request:", JSON.stringify(payoutPayload));

          const payoutResponse = await fetch("https://api.plinqpay.com/v1/payout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": plinqApiKey,
            },
            body: JSON.stringify(payoutPayload),
          });

          const payoutData = await payoutResponse.json();
          console.log("PlinqPay payout response:", JSON.stringify(payoutData));

          if (!payoutResponse.ok) {
            console.error("PlinqPay payout error:", payoutData);
            return new Response(JSON.stringify({
              success: true,
              status: "approved",
              payout_status: "failed",
              payout_error: payoutData.message || "Erro no payout PlinqPay",
              fee,
              net_amount: netAmount,
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({
            success: true,
            status: "approved",
            payout_status: "processing",
            fee,
            net_amount: netAmount,
            payout_data: payoutData,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (payoutErr) {
          console.error("Payout processing error:", payoutErr);
          return new Response(JSON.stringify({
            success: true,
            status: "approved",
            payout_status: "manual",
            message: "Saque aprovado. Payout manual necessário.",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: action === "approve" ? "approved" : "rejected",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process payout error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
