import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, CheckCircle, Shield, User, Copy, Share2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const quickAmounts = [1000, 2500, 5000, 10000, 25000];

const UserProfile = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [donationStatus, setDonationStatus] = useState<string | null>(null);
  const success = searchParams.get("success") === "true";
  const normalizedIdentifier = identifier?.trim().replace(/^@/, "") ?? "";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!normalizedIdentifier) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      let { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", normalizedIdentifier)
        .maybeSingle();

      if (!data) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(normalizedIdentifier)) {
          const { data: byId } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", normalizedIdentifier)
            .maybeSingle();
          data = byId;
        }
      }

      setProfile(data);

      if (data) {
        // Donation count is fetched via edge function to avoid PII exposure
        try {
          const res = await supabase.functions.invoke("plinqpay-checkout", {
            body: { action: "count", recipient_id: data.id },
          });
          setDonationCount(res.data?.count || 0);
        } catch {
          setDonationCount(0);
        }
      }

      setProfileLoading(false);
    };

    fetchProfile();
  }, [normalizedIdentifier]);

  // Poll donation status when we have a payment result
  useEffect(() => {
    if (!paymentResult?.donation_id) return;

    const interval = setInterval(async () => {
      const { data: statusData } = await (supabase.rpc as any)("get_donation_status", {
        p_donation_id: paymentResult.donation_id,
      });
      const status = statusData as string | null;

      if (status === "completed") {
        setDonationStatus("completed");
        clearInterval(interval);
        toast.success("Pagamento confirmado! 🎉");
      } else if (status === "failed") {
        setDonationStatus("failed");
        clearInterval(interval);
        toast.error("Pagamento falhou ou expirou.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentResult?.donation_id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1000) {
      toast.error("Valor mínimo é 1.000 AOA");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("plinqpay-checkout", {
        body: {
          recipient_username: profile.username,
          amount: Math.round(amountNum),
          message,
          donor_name: donorName || "Anônimo",
          donor_email: donorEmail,
          donor_phone: donorPhone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPaymentResult(data);
      setDonationStatus("pending");
      toast.success("Referência gerada! Efectue o pagamento.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/@${profile?.username || normalizedIdentifier}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const copyReference = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const resetPayment = () => {
    setPaymentResult(null);
    setDonationStatus(null);
    setAmount("");
    setMessage("");
    setDonorName("");
    setDonorEmail("");
    setDonorPhone("");
  };

  if (success || donationStatus === "completed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            Pagamento confirmado! 🎉
          </h1>
          <p className="mb-6 text-muted-foreground">
            Obrigado pela sua generosidade para @{profile?.username || normalizedIdentifier}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetPayment}>
              Nova doação
            </Button>
            <Link to="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <User size={32} className="text-muted-foreground" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
          Usuário não encontrado
        </h1>
        <p className="mb-6 text-muted-foreground">{identifier} não existe na plataforma.</p>
        <Link to="/">
          <Button variant="outline">Voltar ao início</Button>
        </Link>
      </div>
    );
  }

  const initial = (profile.full_name || profile.username || "U")[0].toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Pilha-Money" className="h-8 w-8" />
            <span className="font-display text-base font-bold text-foreground">Pilha-Money</span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="rounded-full text-xs font-medium">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
          {/* Profile Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
            <div className="relative px-5 pb-5">
              <div className="-mt-12 mb-3 flex items-end justify-between">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-card bg-muted shadow-md">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <span className="font-display text-3xl font-bold text-primary">{initial}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pb-1">
                  <button onClick={copyProfileLink} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted" title="Copiar link">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => { if (navigator.share) { navigator.share({ title: `Doe para ${profile.full_name || profile.username}`, url: `${window.location.origin}/@${profile.username}` }); } else { copyProfileLink(); } }} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted" title="Compartilhar">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
              <h1 className="font-display text-xl font-bold leading-tight text-card-foreground">{profile.full_name || profile.username}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
              <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart size={14} className="text-primary" />
                  <span className="font-medium">{donationCount}</span>
                  <span>{donationCount === 1 ? "doação" : "doações"}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Result - Reference Display */}
          <AnimatePresence>
            {paymentResult && donationStatus === "pending" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="mb-6 overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-sm"
              >
                <div className="bg-primary/10 px-5 py-4 text-center">
                  {/* Multicaixa Express Logo */}
                  <div className="mx-auto mb-3 flex items-center justify-center gap-2">
                    <svg viewBox="0 0 40 40" className="h-10 w-10">
                      <rect width="40" height="40" rx="8" fill="#E31937"/>
                      <text x="20" y="15" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">MULTICAIXA</text>
                      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="9" fontWeight="900">EXPRESS</text>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-muted-foreground">Pagamento por</div>
                      <div className="font-display text-lg font-bold text-foreground">Referência</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Efectue o pagamento num terminal ATM ou app bancária</p>
                </div>

                <div className="space-y-4 p-5">
                  {/* Entity */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Entidade</div>
                      <div className="font-display text-2xl font-bold text-foreground">{paymentResult.entity || "01055"}</div>
                    </div>
                    <button onClick={() => copyReference(paymentResult.entity || "01055")} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                      <Copy size={14} />
                    </button>
                  </div>

                  {/* Reference */}
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Referência</div>
                      <div className="font-display text-2xl font-bold tracking-wider text-foreground">{paymentResult.reference || "A gerar..."}</div>
                    </div>
                    {paymentResult.reference && (
                      <button onClick={() => copyReference(paymentResult.reference)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                        <Copy size={14} />
                      </button>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Valor a pagar</div>
                      <div className="font-display text-2xl font-bold text-primary">{Number(paymentResult.amount || 0).toLocaleString("pt-AO")} AOA</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-4 py-3">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                    <span className="text-sm font-medium text-warning">Aguardando pagamento...</span>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    O status será atualizado automaticamente após o pagamento
                  </p>

                  <Button variant="outline" className="w-full" onClick={resetPayment}>
                    Cancelar e voltar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Donation Form Card - only show if no pending payment */}
          {!paymentResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="border-b border-border bg-muted/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground">
                  <Heart size={16} className="text-primary" />
                  Apoiar {profile.full_name || profile.username}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pagamento seguro via Multicaixa Express • Referência bancária
                </p>
              </div>

              <form onSubmit={handlePayment} className="space-y-5 p-5">
                {/* Quick amounts in AOA */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">Escolha um valor (AOA)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className={`rounded-xl border-2 py-3 text-xs font-bold transition-all ${
                          amount === String(val)
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-transparent bg-muted text-foreground hover:border-primary/30"
                        }`}
                      >
                        {val >= 1000 ? `${val / 1000}k` : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom amount */}
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Ou digite outro valor</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="1000"
                      placeholder="0"
                      className="h-14 rounded-xl pr-16 text-2xl font-bold"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">AOA</span>
                  </div>
                </div>

                {/* Donor name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Seu nome</label>
                  <Input placeholder="Anônimo" value={donorName} onChange={(e) => setDonorName(e.target.value)} maxLength={100} className="h-11 rounded-xl" />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                    <Mail size={14} /> E-mail (opcional)
                  </label>
                  <Input type="email" placeholder="voce@email.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} maxLength={120} className="h-11 rounded-xl" />
                </div>

                {/* Donor phone */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                    <Phone size={14} /> Telefone (opcional)
                  </label>
                  <Input placeholder="+244 9XX XXX XXX" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} maxLength={20} className="h-11 rounded-xl" />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                    <MessageSquare size={14} /> Mensagem
                  </label>
                  <Textarea placeholder="Deixe uma mensagem de apoio..." className="resize-none rounded-xl" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} />
                  <div className="mt-1 text-right text-xs text-muted-foreground">{message.length}/200</div>
                </div>

                {/* Multicaixa Express badge */}
                <div className="flex items-center justify-center gap-3 rounded-xl bg-muted/50 py-3">
                  <svg viewBox="0 0 120 30" className="h-7 w-auto">
                    <rect width="120" height="30" rx="4" fill="#E31937"/>
                    <text x="60" y="12" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">MULTICAIXA</text>
                    <text x="60" y="23" textAnchor="middle" fill="white" fontSize="8" fontWeight="900">EXPRESS</text>
                  </svg>
                  <div className="h-5 w-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">Referência bancária</span>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full gap-2 rounded-xl py-6 text-base font-bold" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="loading-spinner h-4 w-4" /> Gerando referência...
                    </span>
                  ) : (
                    <>
                      <Heart size={18} /> Gerar referência • {amount ? `${Number(amount).toLocaleString("pt-AO")} AOA` : "0 AOA"}
                    </>
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Shield size={12} /> Pagamento seguro via PlinqPay
                </p>
              </form>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
