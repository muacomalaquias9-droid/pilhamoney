import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("PlinqPay webhook received:", JSON.stringify(payload));

    const paymentId = payload.id || payload.payment_id;
    const status = payload.status;

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing payment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the donation by plinqpay payment id (stored in stripe_session_id)
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("stripe_session_id", paymentId)
      .maybeSingle();

    if (donationError || !donation) {
      console.error("Donation not found for payment:", paymentId);
      return new Response(JSON.stringify({ error: "Donation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "completed" || status === "paid" || status === "success") {
      // Update donation status
      await supabase
        .from("donations")
        .update({ status: "completed" })
        .eq("id", donation.id);

      // Update wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", donation.recipient_id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            balance: wallet.balance + donation.amount,
            total_received: wallet.total_received + donation.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);
      }

      console.log("PlinqPay payment completed for donation:", donation.id);
    } else if (status === "failed" || status === "cancelled" || status === "expired") {
      await supabase
        .from("donations")
        .update({ status: "failed" })
        .eq("id", donation.id);

      console.log("PlinqPay payment failed for donation:", donation.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("PlinqPay webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
