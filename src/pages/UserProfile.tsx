import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageSquare, CheckCircle, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaymentIcons from "@/components/PaymentIcons";

const quickAmounts = [5, 10, 25, 50, 100];

const UserProfile = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
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
        const { count } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", data.id)
          .eq("status", "completed");
        setDonationCount(count || 0);
      } else {
        setDonationCount(0);
      }

      setProfileLoading(false);
    };

    fetchProfile();
  }, [normalizedIdentifier]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1) {
      toast.error("Valor mínimo é $1.00");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          recipient_username: profile.username,
          amount: Math.round(amountNum * 100),
          message,
          donor_name: donorName || "Anônimo",
          success_url: `${window.location.origin}/@${profile.username}?success=true`,
          cancel_url: `${window.location.origin}/@${profile.username}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Erro ao criar sessão de pagamento");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
      setLoading(false);
    }
  };

  if (success) {
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
            Doação enviada! 🎉
          </h1>
          <p className="mb-6 text-muted-foreground">
            Obrigado pela sua generosidade para @{profile?.username || normalizedIdentifier}
          </p>
          <Link to={`/@${profile?.username || normalizedIdentifier}`}>
            <Button variant="outline" className="gap-2">
              <ArrowBack /> Voltar ao perfil
            </Button>
          </Link>
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
        <p className="mb-6 text-muted-foreground">@{username} não existe na plataforma.</p>
        <Link to="/">
          <Button variant="outline">Voltar ao início</Button>
        </Link>
      </div>
    );
  }

  const initial = (profile.full_name || profile.username || "U")[0].toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Pilha-Money" className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-foreground">Pilha-Money</span>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-xs">Entrar</Button>
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <div className="container mx-auto max-w-lg px-4 py-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-3 border-primary/20 bg-muted">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <span className="font-display text-2xl font-bold text-primary">{initial}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h1 className="font-display text-xl font-bold text-card-foreground">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="text-primary" />
                    {donationCount} {donationCount === 1 ? "doação" : "doações"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Donation Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="border-b border-border px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground">
                <Heart size={16} className="text-primary" />
                Enviar uma doação
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Apoie {profile.full_name || profile.username} com qualquer valor
              </p>
            </div>

            <form onSubmit={handlePayment} className="space-y-5 p-6">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-card-foreground">Valor da doação</label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                        amount === String(val)
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Ou digite um valor personalizado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    className="h-14 pl-10 text-2xl font-bold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Seu nome</label>
                <Input
                  placeholder="Anônimo"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  maxLength={100}
                  className="h-11"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                  <MessageSquare size={14} /> Mensagem
                </label>
                <Textarea
                  placeholder="Deixe uma mensagem de apoio..."
                  className="resize-none"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">{message.length}/200</div>
              </div>

              {/* Payment brand icons */}
              <PaymentIcons />

              <Button type="submit" className="w-full gap-2 rounded-xl text-base" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading-spinner h-4 w-4" /> Processando...
                  </span>
                ) : (
                  <>
                    <Heart size={18} /> Enviar ${amount || "0.00"}
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <Shield size={12} /> Pagamento seguro via Stripe
              </p>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const ArrowBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export default UserProfile;
