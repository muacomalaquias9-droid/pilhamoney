import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageSquare, CheckCircle, Shield, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const quickAmounts = [5, 10, 25, 50, 100];

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      setProfile(data);
      setProfileLoading(false);

      if (data) {
        const { count } = await supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", data.id)
          .eq("status", "completed");
        setDonationCount(count || 0);
      }
    };
    fetchProfile();
  }, [username]);

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
          recipient_username: username,
          amount: Math.round(amountNum * 100),
          message,
          donor_name: donorName || "Anônimo",
          success_url: `${window.location.origin}/@${username}?success=true`,
          cancel_url: `${window.location.origin}/@${username}`,
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
            Obrigado pela sua generosidade para @{username}
          </p>
          <Link to={`/@${username}`}>
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
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Pilha-Money" className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-foreground">Pilha-Money</span>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-xs">
              Entrar
            </Button>
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
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <span className="font-display text-2xl font-bold text-primary">
                      {initial}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h1 className="font-display text-xl font-bold text-card-foreground">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
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
              {/* Quick amounts */}
              <div>
                <label className="mb-2.5 block text-sm font-medium text-card-foreground">
                  Valor da doação
                </label>
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

              {/* Custom amount */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Ou digite um valor personalizado
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    $
                  </span>
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

              {/* Donor name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                  Seu nome
                </label>
                <Input
                  placeholder="Anônimo"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  maxLength={100}
                  className="h-11"
                />
              </div>

              {/* Message */}
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
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {message.length}/200
                </div>
              </div>

              {/* Payment brands */}
              <div className="flex items-center justify-center gap-4 py-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
                    <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102h2.037zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.481-.013 1.08.964 1.684 1.7 2.044.756.368 1.01.604 1.006.933-.005.504-.602.726-1.16.735-.974.015-1.54-.263-1.992-.474l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.375-2.572zm5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488l.233 1.12zm-2.163-2.656l1.02-2.815.588 2.815h-1.608zm-8.16 2.656l1.603-7.496H11.46l-1.603 7.496h2.026z"/>
                  </svg>
                  <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
                    <path d="M15.245 17.831h-6.49V6.168h6.49v11.663z"/>
                    <path d="M9.167 12a7.404 7.404 0 012.833-5.832 7.431 7.431 0 00-4.636-1.621C3.596 4.547.5 7.886.5 12s3.096 7.453 6.864 7.453A7.43 7.43 0 0012 17.832 7.404 7.404 0 019.167 12z"/>
                    <path d="M23.5 12c0 4.114-3.096 7.453-6.864 7.453A7.432 7.432 0 0112 17.832 7.404 7.404 0 0014.833 12 7.404 7.404 0 0012 6.168a7.431 7.431 0 014.636-1.621C20.404 4.547 23.5 7.886 23.5 12z"/>
                  </svg>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 rounded-xl text-base"
                size="lg"
                disabled={loading}
              >
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

// Simple arrow back icon
const ArrowBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export default UserProfile;
