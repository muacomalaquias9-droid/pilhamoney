import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const bodySchema = z.object({
  receiver_identifier: z.string().trim().min(1),
  amount: z.number().int().min(100, "Valor mínimo é 100 AOA"),
  note: z.string().max(200).optional().default(""),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiver_identifier, amount, note } = parsed.data;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is locked
    const { data: security } = await supabase
      .from("user_security")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (security?.locked_until && new Date(security.locked_until) > new Date()) {
      return new Response(JSON.stringify({ error: "Conta temporariamente bloqueada. Tente novamente mais tarde." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find receiver by username or UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const identifier = receiver_identifier.replace(/^@/, "");
    let receiver;

    if (uuidRegex.test(identifier)) {
      const { data } = await supabase.from("profiles").select("id, username, full_name").eq("id", identifier).maybeSingle();
      receiver = data;
    }
    if (!receiver) {
      const { data } = await supabase.from("profiles").select("id, username, full_name").eq("username", identifier).maybeSingle();
      receiver = data;
    }

    if (!receiver) {
      return new Response(JSON.stringify({ error: "Destinatário não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (receiver.id === user.id) {
      return new Response(JSON.stringify({ error: "Não pode transferir para si mesmo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check sender balance
    const { data: senderWallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
    if (!senderWallet || senderWallet.balance < amount) {
      return new Response(JSON.stringify({ error: "Saldo insuficiente" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily limit
    const dailyLimit = security?.daily_transfer_limit || 500000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayTransfers } = await supabase
      .from("transfers")
      .select("amount")
      .eq("sender_id", user.id)
      .gte("created_at", today.toISOString());

    const todayTotal = (todayTransfers || []).reduce((sum: number, t: any) => sum + t.amount, 0);
    if (todayTotal + amount > dailyLimit) {
      return new Response(JSON.stringify({ error: `Limite diário de ${dailyLimit.toLocaleString()} AOA atingido` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute transfer atomically
    // 1. Deduct from sender
    const { error: deductError } = await supabase
      .from("wallets")
      .update({ balance: senderWallet.balance - amount, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (deductError) throw deductError;

    // 2. Credit receiver
    const { data: receiverWallet } = await supabase.from("wallets").select("*").eq("user_id", receiver.id).maybeSingle();
    if (receiverWallet) {
      await supabase.from("wallets").update({
        balance: receiverWallet.balance + amount,
        total_received: receiverWallet.total_received + amount,
        updated_at: new Date().toISOString(),
      }).eq("user_id", receiver.id);
    } else {
      await supabase.from("wallets").insert({
        user_id: receiver.id,
        balance: amount,
        total_received: amount,
      });
    }

    // 3. Record transfer
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .insert({
        sender_id: user.id,
        receiver_id: receiver.id,
        amount,
        note: note || "",
        status: "completed",
      })
      .select()
      .single();

    if (transferError) throw transferError;

    console.log(`✅ Transfer ${transfer.id}: ${amount} AOA from ${user.id} to ${receiver.id}`);

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer.id,
      receiver_username: receiver.username,
      receiver_name: receiver.full_name,
      amount,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Transfer error:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
