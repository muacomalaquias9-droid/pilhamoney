import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Bot, User as UserIcon, Shield, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Msg = {
  id: string;
  sender: "user" | "ai" | "admin" | "system";
  content: string;
  created_at: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  ban_reason_snapshot: string | null;
  requires_bi_verification: boolean;
  bi_deadline: string | null;
};

type BIRequest = {
  id: string;
  status: string;
  expires_at: string;
  ai_verdict: string | null;
  bi_image_url: string | null;
};

export default function Support() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [biRequest, setBiRequest] = useState<BIRequest | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form para criar novo ticket (pré-preenchido por query params)
  const prefillReason = params.get("reason") || "";
  const prefillCategory = params.get("category") || "general";
  const [subject, setSubject] = useState(
    prefillCategory === "ban_appeal" ? "Pedido de revisão da suspensão" : "Pedido de ajuda",
  );
  const [firstMessage, setFirstMessage] = useState(
    prefillReason ? `A minha conta foi suspensa com este motivo:\n\n"${prefillReason}"\n\nPeço revisão.` : "",
  );

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Carrega último ticket aberto ou o passado em ?ticket=
  useEffect(() => {
    if (!user) return;
    const ticketId = params.get("ticket");
    const load = async () => {
      let q = supabase.from("support_tickets").select("*").eq("user_id", user.id);
      if (ticketId) q = q.eq("id", ticketId);
      else q = q.in("status", ["open", "escalated"]).order("created_at", { ascending: false }).limit(1);
      const { data } = await q.maybeSingle();
      if (data) setTicket(data as Ticket);
    };
    load();
  }, [user, params]);

  // Carrega mensagens + realtime + bi request quando há ticket
  useEffect(() => {
    if (!ticket) return;
    const load = async () => {
      const { data } = await supabase
        .from("support_messages").select("*").eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      setMessages((data as Msg[]) || []);

      const { data: bi } = await supabase
        .from("bi_reverification_requests").select("*").eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      setBiRequest(bi as BIRequest | null);
    };
    load();

    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticket.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Msg]))
      .on("postgres_changes", { event: "*", schema: "public", table: "bi_reverification_requests", filter: `ticket_id=eq.${ticket.id}` },
        () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${ticket.id}` },
        (payload) => setTicket(payload.new as Ticket))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Timer regressivo de 1s para BI deadline
  useEffect(() => {
    if (!biRequest || biRequest.status !== "pending") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [biRequest]);

  const createTicket = async () => {
    if (!user) return;
    if (!firstMessage.trim()) { toast.error("Escreve uma mensagem inicial."); return; }
    setCreating(true);
    try {
      const { data: secData } = await supabase
        .from("user_security").select("ban_reason").eq("user_id", user.id).maybeSingle();
      const { data: t, error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: subject || "Pedido de ajuda",
        category: prefillCategory,
        ban_reason_snapshot: prefillReason || secData?.ban_reason || null,
      }).select().single();
      if (error) throw error;
      setTicket(t as Ticket);
      // envia primeira mensagem para a IA
      await supabase.functions.invoke("support-ai", {
        body: { ticket_id: t.id, message: firstMessage },
      });
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar ticket");
    } finally {
      setCreating(false);
    }
  };

  const send = async () => {
    if (!ticket || !text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("support-ai", {
        body: { ticket_id: ticket.id, message: msg },
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message || "Erro a enviar");
    } finally {
      setSending(false);
    }
  };

  const uploadBI = async (e: React.ChangeEvent<HTMLInputElement>, kind: "bi" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file || !user || !biRequest || !ticket) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    if (new Date(biRequest.expires_at) < new Date()) {
      toast.error("Prazo expirado. Pede uma nova verificação."); return;
    }
    const path = `${user.id}/reverif/${biRequest.id}-${kind}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("identity-docs").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Falha no upload"); return; }
    const update: any = { submitted_at: new Date().toISOString(), status: "submitted" };
    if (kind === "bi") update.bi_image_url = path;
    if (kind === "selfie") update.selfie_url = path;
    await supabase.from("bi_reverification_requests").update(update).eq("id", biRequest.id);
    await supabase.from("support_messages").insert({
      ticket_id: ticket.id, sender: "user",
      content: kind === "bi" ? "📎 Enviei a foto do meu BI." : "📎 Enviei a selfie com o BI.",
    });
    toast.success("Documento enviado. Aguarda análise.");
  };

  if (authLoading) return null;

  // Se não há ticket: form de criação
  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="container mx-auto flex items-center gap-2 px-4 py-3">
            <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
            <h1 className="font-display text-base font-bold">Suporte Pilha Money</h1>
          </div>
        </header>
        <div className="container mx-auto max-w-lg p-4 space-y-4">
          {prefillReason && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Motivo do bloqueio</AlertTitle>
              <AlertDescription className="text-xs">{prefillReason}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assunto</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem</label>
            <Textarea value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)}
              rows={6} maxLength={2000} placeholder="Explica o que aconteceu..." />
            <p className="text-xs text-muted-foreground">{firstMessage.length}/2000</p>
          </div>
          <Button className="w-full" disabled={creating} onClick={createTicket}>
            {creating ? "A abrir ticket..." : "Falar com o Suporte IA"}
          </Button>
        </div>
      </div>
    );
  }

  const deadlineMs = biRequest && biRequest.status === "pending"
    ? Math.max(0, new Date(biRequest.expires_at).getTime() - now) : 0;
  const mm = Math.floor(deadlineMs / 60000);
  const ss = Math.floor((deadlineMs % 60000) / 1000);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
          <div className="flex-1 min-w-0">
            <h1 className="truncate font-display text-base font-bold">{ticket.subject}</h1>
            <p className="text-[11px] text-muted-foreground">Estado: {ticket.status}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
            <Bot size={12} /> Suporte IA
          </div>
        </div>
      </header>

      {/* BI verification banner */}
      {biRequest && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="container mx-auto max-w-lg">
            {biRequest.status === "pending" && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-700">⚠️ Verificação rigorosa necessária</p>
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700">
                    <Clock size={12} /> {String(mm).padStart(2,"0")}:{String(ss).padStart(2,"0")}
                  </span>
                </div>
                <p className="mb-3 text-xs text-amber-800/90">
                  Envia o teu BI original e uma selfie segurando o BI dentro de 10 minutos.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-amber-500/40 bg-background p-2 text-xs hover:bg-amber-50">
                    <Upload size={12} /> Foto do BI
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadBI(e, "bi")} />
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-amber-500/40 bg-background p-2 text-xs hover:bg-amber-50">
                    <Upload size={12} /> Selfie c/ BI
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadBI(e, "selfie")} />
                  </label>
                </div>
              </>
            )}
            {biRequest.status === "submitted" && (
              <p className="flex items-center gap-2 text-sm text-amber-700"><Clock size={14} /> Documentos enviados — em análise.</p>
            )}
            {biRequest.status === "approved" && (
              <p className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 size={14} /> Verificação aprovada.</p>
            )}
            {biRequest.status === "rejected" && (
              <p className="flex items-center gap-2 text-sm text-red-700"><XCircle size={14} /> Verificação rejeitada: {biRequest.ai_verdict || "documento inválido"}.</p>
            )}
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-lg space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">Sem mensagens ainda.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender === "user";
            const Icon = m.sender === "ai" ? Bot : m.sender === "admin" ? Shield : UserIcon;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.sender === "ai" ? "bg-primary/15 text-primary"
                  : m.sender === "admin" ? "bg-amber-500/15 text-amber-600"
                  : mine ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon size={14} />
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  <p className={`mt-1 text-[9px] opacity-60 ${mine ? "text-right" : ""}`}>
                    {new Date(m.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-card p-3">
        <div className="container mx-auto flex max-w-lg gap-2">
          <Input
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escreve a tua mensagem..."
            disabled={sending || ticket.status === "closed"}
            maxLength={2000}
          />
          <Button onClick={send} disabled={sending || !text.trim() || ticket.status === "closed"}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}