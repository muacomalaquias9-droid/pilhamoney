import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, CreditCard, MessageSquare, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          amount: Math.round(amountNum * 100), // convert to cents
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
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Doação enviada!</h1>
          <p className="text-muted-foreground">
            Obrigado pela sua doação para @{username}
          </p>
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
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Usuário não encontrado</h1>
        <p className="text-muted-foreground">@{username} não existe na plataforma.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <div className="container mx-auto max-w-md px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 flex justify-center">
              <img src={logo} alt="Pilha-Money" className="h-12 w-12" />
            </div>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-primary/10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-bold text-primary">
                    {(profile.full_name || profile.username || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {profile.full_name || profile.username}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground">
                  <Heart size={16} className="text-primary" /> Fazer uma doação
                </h2>
              </div>

              <form onSubmit={handlePayment} className="space-y-5 p-6">
                <div>
                  <Label className="mb-2 block text-sm">Escolha um valor</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                          amount === String(val)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/50"
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Ou insira um valor personalizado (USD)</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      className="h-14 pl-9 text-2xl font-bold"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="donor">Seu nome (opcional)</Label>
                  <Input
                    id="donor"
                    placeholder="Anônimo"
                    className="mt-1.5"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="flex items-center gap-1.5">
                    <MessageSquare size={14} /> Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Deixe uma mensagem de apoio..."
                    className="mt-1.5 resize-none"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                  />
                  <div className="mt-1 text-right text-xs text-muted-foreground">{message.length}/200</div>
                </div>

                <div className="flex items-center justify-center gap-3 py-1">
                  <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <CreditCard size={14} /> Visa
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <CreditCard size={14} /> MasterCard
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2 rounded-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="loading-spinner h-4 w-4" /> Processando...
                    </span>
                  ) : (
                    <>
                      <Heart size={18} /> Enviar Doação
                    </>
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Shield size={12} /> Pagamento seguro processado pelo Stripe
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
