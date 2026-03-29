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
    const plinqApiKey = Deno.env.get("PLINQPAY_SECRET_KEY");
    if (!plinqApiKey) throw new Error("PLINQPAY_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recipient_username, amount, message, donor_name, donor_phone } = await req.json();

    if (!recipient_username || !amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo é 100 AOA" }),
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

    // Create PlinqPay transaction via their API
    const plinqPayload = {
      externalId: donation.id,
      callbackUrl: `${supabaseUrl}/functions/v1/plinqpay-webhook`,
      method: "REFERENCE",
      client: {
        name: donor_name || "Anônimo",
        email: "",
        phone: donor_phone || "",
      },
      items: [
        {
          title: `Doação para ${recipient.full_name || recipient.username}`,
          price: amount,
          quantity: 1,
        },
      ],
      amount: 1,
    };

    console.log("PlinqPay request:", JSON.stringify(plinqPayload));

    const plinqResponse = await fetch("https://api.plinqpay.com/v1/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": plinqApiKey,
      },
      body: JSON.stringify(plinqPayload),
    });

    const plinqData = await plinqResponse.json();
    console.log("PlinqPay response:", JSON.stringify(plinqData));

    if (!plinqResponse.ok) {
      console.error("PlinqPay error:", plinqData);
      // Clean up the donation
      await supabase.from("donations").delete().eq("id", donation.id);
      return new Response(
        JSON.stringify({ error: plinqData.message || "Erro ao processar pagamento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store plinqpay transaction id
    const transactionId = plinqData.id || plinqData.transactionId || plinqData.externalId;
    await supabase
      .from("donations")
      .update({ stripe_session_id: transactionId })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        donation_id: donation.id,
        transaction_id: transactionId,
        reference: plinqData.reference || plinqData.referenceId,
        entity: plinqData.entity || "01055",
        amount: amount,
        status: "pending",
        raw: plinqData,
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
