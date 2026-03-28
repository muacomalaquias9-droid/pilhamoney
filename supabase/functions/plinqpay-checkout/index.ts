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
    const plinqSecretKey = Deno.env.get("PLINQPAY_SECRET_KEY");
    if (!plinqSecretKey) throw new Error("PLINQPAY_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recipient_username, amount, message, donor_name, payment_method, success_url, cancel_url } = await req.json();

    if (!recipient_username || !amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo é 100 AOA" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment_method || !["multicaixa_express", "paypay", "reference"].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "Método de pagamento inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find recipient
    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .eq("username", recipient_username)
      .maybeSingle();

    if (recipientError || !recipient) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create donation record
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        recipient_id: recipient.id,
        amount: amount,
        message: message || "",
        donor_name: donor_name || "Anônimo",
        status: "pending",
        currency: "aoa",
      })
      .select()
      .single();

    if (donationError) {
      console.error("Donation insert error:", donationError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar doação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create PlinqPay payment
    const plinqPayload: any = {
      amount: amount,
      currency: "AOA",
      description: `Doação para ${recipient.full_name || recipient.username}`,
      payment_method: payment_method,
      metadata: {
        donation_id: donation.id,
        recipient_id: recipient.id,
        recipient_username: recipient.username,
      },
      callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/plinqpay-webhook`,
      success_url: success_url || `${req.headers.get("origin")}/@${recipient_username}?success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/@${recipient_username}`,
    };

    const plinqResponse = await fetch("https://api.plinqpay.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${plinqSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plinqPayload),
    });

    const plinqData = await plinqResponse.json();

    if (!plinqResponse.ok) {
      console.error("PlinqPay error:", plinqData);
      return new Response(
        JSON.stringify({ error: plinqData.message || "Erro ao processar pagamento PlinqPay" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update donation with plinqpay payment id
    await supabase
      .from("donations")
      .update({ stripe_session_id: plinqData.id || plinqData.payment_id })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        url: plinqData.checkout_url || plinqData.payment_url || plinqData.url,
        payment_id: plinqData.id || plinqData.payment_id,
        reference: plinqData.reference,
        qr_code: plinqData.qr_code,
        payment_method: payment_method,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("PlinqPay checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
