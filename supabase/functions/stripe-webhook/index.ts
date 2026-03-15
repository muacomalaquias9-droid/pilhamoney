import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY not configured", { status: 500 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback without signature verification (dev mode)
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donation_id;
    const recipientId = session.metadata?.recipient_id;

    if (!donationId || !recipientId) {
      console.error("Missing metadata in session:", session.id);
      return new Response("Missing metadata", { status: 400 });
    }

    const amountTotal = session.amount_total || 0;

    // Update donation status
    const { error: donationError } = await supabase
      .from("donations")
      .update({
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", donationId);

    if (donationError) {
      console.error("Error updating donation:", donationError);
    }

    // Update wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", recipientId)
      .maybeSingle();

    if (wallet) {
      await supabase
        .from("wallets")
        .update({
          balance: wallet.balance + amountTotal,
          total_received: wallet.total_received + amountTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", recipientId);
    } else {
      await supabase
        .from("wallets")
        .insert({
          user_id: recipientId,
          balance: amountTotal,
          total_received: amountTotal,
        });
    }

    console.log(`✅ Donation ${donationId} completed: $${(amountTotal / 100).toFixed(2)}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
