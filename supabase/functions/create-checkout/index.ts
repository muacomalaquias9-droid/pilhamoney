import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recipient_username, amount, message, donor_name, success_url, cancel_url } = await req.json();

    if (!recipient_username || !amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Valor mínimo é $1.00" }),
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

    // Create Stripe Checkout session
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Doação para ${recipient.full_name || recipient.username}`,
              description: message ? `"${message}"` : "Doação via Pilha-Money",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: success_url || `${req.headers.get("origin")}/@${recipient_username}?success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/@${recipient_username}`,
      metadata: {
        donation_id: donation.id,
        recipient_id: recipient.id,
        recipient_username: recipient.username,
      },
    });

    // Update donation with stripe session id
    await supabase
      .from("donations")
      .update({ stripe_session_id: session.id })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
