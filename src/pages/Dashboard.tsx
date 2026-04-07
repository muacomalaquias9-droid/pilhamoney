import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Settings, Bell, Shield } from "lucide-react";
import WithdrawModal from "@/components/WithdrawModal";
import TransferModal from "@/components/TransferModal";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VirtualCard from "@/components/dashboard/VirtualCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatsCards from "@/components/dashboard/StatsCards";
import TransactionHistory from "@/components/dashboard/TransactionHistory";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(profileData);

      const { data: walletData } = await supabase
        .from("wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(walletData);

      const { data: donationsData } = await supabase
        .from("donations").select("*").eq("recipient_id", user.id)
        .eq("status", "completed").order("created_at", { ascending: false }).limit(20);
      setDonations(donationsData || []);
    };

    fetchData();

    const channel = supabase
      .channel("dashboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations", filter: `recipient_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "transfers" }, () => fetchData())
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

  const cardNum = (profile.id as string).replace(/[^0-9a-f]/g, "").substring(0, 16).toUpperCase()
    .replace(/[A-F]/g, (c) => String("ABCDEF".indexOf(c))).substring(0, 16).padEnd(16, "0");

  const refreshWallet = () => {
    if (!user) return;
    supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setWallet(data));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9"><Bell size={17} /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/settings/profile")}><Settings size={17} /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { await signOut(); navigate("/"); }}><LogOut size={17} /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-5 space-y-5">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-xl font-bold text-foreground">
            Olá, {(profile.full_name || profile.username).split(" ")[0]} 👋
          </h1>
          <p className="text-xs text-muted-foreground">Bem-vindo à sua carteira Pilha-Money</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <VirtualCard
            balance={balance}
            username={profile.username}
            cardNumber={cardNum}
            showBalance={showBalance}
            onToggleBalance={() => setShowBalance(!showBalance)}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <QuickActions
            username={profile.username}
            onWithdraw={() => setShowWithdrawModal(true)}
            onTransfer={() => setShowTransferModal(true)}
          />
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatsCards totalReceived={totalReceived} donationsCount={donations.length} balance={balance} />
        </motion.div>

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <TransactionHistory userId={user!.id} />
        </motion.div>
      </div>

      <WithdrawModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={balance}
        userId={user!.id}
        onSuccess={refreshWallet}
      />

      <TransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        balance={balance}
        userId={user!.id}
        onSuccess={refreshWallet}
      />
    </div>
  );
};

export default Dashboard;
