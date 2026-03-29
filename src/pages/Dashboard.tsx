import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Send,
  Copy, LogOut, User, Settings, Bell, TrendingUp,
  DollarSign, Eye, EyeOff
} from "lucide-react";
import WithdrawModal from "@/components/WithdrawModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(profileData);

      // Fetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setWallet(walletData);

      // Fetch recent donations
      const { data: donationsData } = await supabase
        .from("donations")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);
      setDonations(donationsData || []);
    };

    fetchData();

    // Realtime for donations
    const channel = supabase
      .channel("dashboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations", filter: `recipient_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  const balance = wallet?.balance || 0;
  const totalReceived = wallet?.total_received || 0;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${profile.username}`);
    toast.success("Link copiado!");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Bell size={18} /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings/profile")}><Settings size={18} /></Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut size={18} /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Olá, {(profile.full_name || profile.username).split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie sua carteira Pilha-Money</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-foreground to-foreground/80 text-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Pilha-Money" className="h-8 w-8" />
                  <span className="text-sm font-medium opacity-80">Carteira Pilha-Money</span>
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className="opacity-70 hover:opacity-100">
                  {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <div className="mb-1 text-sm opacity-70">Saldo disponível</div>
              <div className="mb-4 font-display text-3xl font-bold">
                {showBalance ? `${balance.toLocaleString("pt-AO")} AOA` : "••••••"}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-70">@{profile.username}</span>
                <button onClick={copyLink} className="opacity-70 hover:opacity-100"><Copy size={14} /></button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6 grid grid-cols-3 gap-3">
          <button onClick={copyLink} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Send size={18} className="text-primary" /></div>
            <span className="text-xs font-medium text-card-foreground">Receber</span>
          </button>
          <button onClick={() => setShowWithdrawModal(true)} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10"><ArrowUpRight size={18} className="text-accent" /></div>
            <span className="text-xs font-medium text-card-foreground">Sacar</span>
          </button>
          <Link to={`/@${profile.username}`} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><User size={18} className="text-primary" /></div>
            <span className="text-xs font-medium text-card-foreground">Perfil</span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6 grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><ArrowDownLeft size={18} className="text-primary" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Recebido</div>
                <div className="font-display text-lg font-bold text-card-foreground">${totalReceived.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10"><TrendingUp size={18} className="text-accent" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Doações</div>
                <div className="font-display text-lg font-bold text-card-foreground">{donations.length}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><DollarSign size={18} /> Doações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  <p>Nenhuma doação ainda</p>
                  <p className="text-xs mt-1">Compartilhe seu link para receber doações</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donations.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <ArrowDownLeft size={14} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-card-foreground">
                            De {d.donor_name || "Anônimo"}
                          </div>
                          {d.message && <div className="text-xs text-muted-foreground">{d.message}</div>}
                        </div>
                      </div>
                      <div className="font-medium text-primary">+${(d.amount / 100).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <WithdrawModal
          open={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          balance={balance}
          userId={user!.id}
          onSuccess={() => {
            // Refresh data
            supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle().then(({ data }) => setWallet(data));
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
