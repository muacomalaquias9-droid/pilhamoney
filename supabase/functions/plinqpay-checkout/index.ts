import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const bodySchema = z.object({
  recipient_username: z.string().trim().min(1),
  amount: z.number().int().min(1000),
  message: z.string().max(200).optional().default(""),
  donor_name: z.string().trim().min(1).max(100).optional().default("Anônimo"),
  donor_phone: z.string().trim().max(30).optional().default(""),
  donor_email: z.string().trim().email().optional().or(z.literal("")),
});

const pickValue = <T,>(...values: T[]) => values.find((value) => value !== undefined && value !== null && value !== "");

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

    const parsedBody = bodySchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: parsedBody.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipient_username, amount, message, donor_name, donor_phone, donor_email } = parsedBody.data;

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
        donor_email: donor_email || null,
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

    const fallbackEmail = `donation-${donation.id}@pilhamoney.app`;
    const clientEmail = donor_email?.trim() || fallbackEmail;
    const clientPhone = donor_phone?.trim() || "+244923000000";

    // Create PlinqPay transaction via their API
    const plinqPayload = {
      externalId: donation.id,
      callbackUrl: `${supabaseUrl}/functions/v1/plinqpay-webhook`,
      method: "REFERENCE",
      client: {
        name: donor_name || "Anônimo",
        email: clientEmail,
        phone: clientPhone,
      },
      items: [
        {
          title: `Doação para ${recipient.full_name || recipient.username}`,
          price: amount,
          quantity: 1,
        },
      ],
      amount,
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
    const transactionId = pickValue(
      plinqData.id,
      plinqData.transactionId,
      plinqData.transaction?.id,
      plinqData.data?.id,
      plinqData.externalId,
    );

    const reference = pickValue(
      plinqData.reference,
      plinqData.referenceId,
      plinqData.data?.reference,
      plinqData.transaction?.reference,
    );

    const entity = pickValue(
      plinqData.entity,
      plinqData.data?.entity,
      plinqData.transaction?.entity,
      "01055",
    );

    await supabase
      .from("donations")
      .update({ stripe_session_id: transactionId })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({
        donation_id: donation.id,
        transaction_id: transactionId,
        reference,
        entity,
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
