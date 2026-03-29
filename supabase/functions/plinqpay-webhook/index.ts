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

    // PlinqPay sends: { id, externalId, status, ... }
    const externalId = payload.externalId || payload.external_id;
    const transactionId = payload.id || payload.transactionId;
    const status = (payload.status || "").toUpperCase();

    // Try to find donation by externalId (which is the donation.id) or by stripe_session_id (transactionId)
    let donation = null;

    if (externalId) {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("id", externalId)
        .maybeSingle();
      donation = data;
    }

    if (!donation && transactionId) {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("stripe_session_id", transactionId)
        .maybeSingle();
      donation = data;
    }

    if (!donation) {
      console.error("Donation not found for:", { externalId, transactionId });
      return new Response(JSON.stringify({ error: "Donation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already completed? Skip
    if (donation.status === "completed") {
      return new Response(JSON.stringify({ received: true, already_completed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "COMPLETED" || status === "PAID" || status === "SUCCESS" || status === "APPROVED") {
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
      } else {
        await supabase
          .from("wallets")
          .insert({
            user_id: donation.recipient_id,
            balance: donation.amount,
            total_received: donation.amount,
          });
      }

      console.log(`✅ PlinqPay payment completed for donation: ${donation.id}, amount: ${donation.amount} AOA`);
    } else if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED" || status === "REJECTED") {
      await supabase
        .from("donations")
        .update({ status: "failed" })
        .eq("id", donation.id);

      console.log(`❌ PlinqPay payment failed for donation: ${donation.id}`);
    } else {
      console.log(`ℹ️ PlinqPay status update: ${status} for donation: ${donation.id}`);
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
