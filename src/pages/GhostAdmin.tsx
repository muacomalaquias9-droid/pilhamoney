import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Wallet, ArrowDownUp, Gift, Ban, CheckCircle, Clock, RefreshCw, Shield, FileText, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

const ADMIN_EMAIL = "isaacmuaco528@gmail.com";

const GhostAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "users" | "withdrawals" | "donations" | "transfers" | "verification" | "revenue">("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, wRes, wdRes, dRes, tRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("wallets").select("*"),
      supabase.from("withdrawals").select("*, profile:profiles!withdrawals_user_id_fkey(username, full_name)").order("created_at", { ascending: false }).limit(200),
      supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("transfers").select("*, sender:profiles!transfers_sender_id_fkey(username), receiver:profiles!transfers_receiver_id_fkey(username)").order("created_at", { ascending: false }).limit(200),
    ]);
    setUsers(pRes.data || []);
    setWallets(wRes.data || []);
    setWithdrawals(wdRes.data || []);
    setDonations(dRes.data || []);
    setTransfers(tRes.data || []);
    setLoading(false);
  };

  const processWithdrawal = async (withdrawalId: string, action: "approve" | "reject") => {
    if (!user) return;
    setProcessingId(withdrawalId);
    try {
      // Use the payout edge function for approvals
      const { data, error } = await supabase.functions.invoke("process-payout", {
        body: { withdrawal_id: withdrawalId, action },
      });
      
      if (error) { toast.error(error.message); return; }
      
      if (data?.success) {
        const feeInfo = data.fee ? ` (Taxa: ${data.fee.toLocaleString("pt-AO")} Kz, Líquido: ${data.net_amount?.toLocaleString("pt-AO")} Kz)` : "";
        toast.success(`Saque ${action === "approve" ? "aprovado" : "rejeitado"}!${feeInfo}`);
        if (data.payout_status === "failed") {
          toast.warning("Payout PlinqPay falhou - processar manualmente");
        }
        fetchAll();
      } else {
        toast.error(data?.error || "Erro ao processar saque");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setProcessingId(null);
    }
  };

  const approveBi = async (userId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        bi_verified: action === "approved", 
        bi_verification_status: action 
      } as any)
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(`BI ${action === "approved" ? "aprovado" : "rejeitado"}`);
      fetchAll();
    }
  };

  const getWallet = (userId: string) => wallets.find((w) => w.user_id === userId);

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
      completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      approved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: Ban },
      failed: { bg: "bg-red-100", text: "text-red-700", icon: Ban },
      none: { bg: "bg-gray-100", text: "text-gray-500", icon: Clock },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon size={12} /> {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const totalBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const totalReceived = wallets.reduce((s, w) => s + (w.total_received || 0), 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const completedDonations = donations.filter((d) => d.status === "completed");
  const totalDonations = completedDonations.reduce((s, d) => s + d.amount, 0);
  const totalWithdrawnApproved = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const totalFees = Math.round(totalWithdrawnApproved * 0.03);
  const pendingBi = users.filter((u: any) => u.bi_verification_status === "pending");

  const tabs = [
    { key: "overview", label: "Visão Geral", icon: Wallet },
    { key: "users", label: "Usuários", icon: Users },
    { key: "withdrawals", label: "Saques", icon: ArrowDownUp },
    { key: "donations", label: "Doações", icon: Gift },
    { key: "transfers", label: "Transferências", icon: ArrowDownUp },
    { key: "verification", label: `Verificação${pendingBi.length > 0 ? ` (${pendingBi.length})` : ""}`, icon: Shield },
    { key: "revenue", label: "Rendimento", icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <Logo size="sm" />
          <Button variant="ghost" size="icon" onClick={fetchAll}><RefreshCw size={16} /></Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-xl font-bold">Painel Administrativo</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Usuários", value: users.length, color: "text-blue-600" },
                { label: "Saldo Total", value: `${totalBalance.toLocaleString("pt-AO")} Kz`, color: "text-green-600" },
                { label: "Total Recebido", value: `${totalReceived.toLocaleString("pt-AO")} Kz`, color: "text-primary" },
                { label: "Saques Pendentes", value: pendingWithdrawals.length, color: "text-yellow-600" },
                { label: "Total Doações", value: `${totalDonations.toLocaleString("pt-AO")} Kz`, color: "text-emerald-600" },
                { label: "Rendimento (3%)", value: `${totalFees.toLocaleString("pt-AO")} Kz`, color: "text-purple-600" },
                { label: "BI Pendentes", value: pendingBi.length, color: "text-orange-600" },
                { label: "Transferências", value: transfers.length, color: "text-cyan-600" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 font-display text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {pendingWithdrawals.length > 0 && (
              <div>
                <h3 className="mb-2 font-display text-sm font-bold text-foreground">Saques Pendentes</h3>
                <div className="space-y-2">
                  {pendingWithdrawals.slice(0, 5).map((w) => {
                    let detail: any = {};
                    try { detail = JSON.parse(w.method_detail); } catch {}
                    const fee = Math.round(w.amount * 0.03);
                    return (
                      <div key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                        <div>
                          <p className="text-sm font-medium">{(w as any).profile?.full_name || (w as any).profile?.username}</p>
                          <p className="text-xs text-muted-foreground">{detail.bank || w.method} • IBAN: {detail.iban?.slice(0, 12)}...</p>
                          <p className="font-display text-sm font-bold text-primary">{Number(w.amount).toLocaleString("pt-AO")} Kz</p>
                          <p className="text-xs text-muted-foreground">Taxa 3%: {fee.toLocaleString("pt-AO")} Kz • Líquido: {(w.amount - fee).toLocaleString("pt-AO")} Kz</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {statusBadge(w.status)}
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => processWithdrawal(w.id, "approve")} disabled={processingId === w.id}>
                              <CheckCircle size={12} className="mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => processWithdrawal(w.id, "reject")} disabled={processingId === w.id}>
                              <Ban size={12} className="mr-1" /> Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-display text-lg font-bold">Usuários ({users.length})</h2>
            {users.map((u) => {
              const w = getWallet(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {(u.full_name || u.username || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.full_name || u.username}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {u.bi_verified && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5">✓ BI Verificado</span>}
                        {u.birth_date && <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5">{u.birth_date}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-primary">{(w?.balance || 0).toLocaleString("pt-AO")} Kz</p>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {tab === "withdrawals" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-display text-lg font-bold">Saques ({withdrawals.length})</h2>
            {withdrawals.map((w) => {
              let detail: any = {};
              try { detail = JSON.parse(w.method_detail); } catch {}
              const fee = Math.round(w.amount * 0.03);
              return (
                <div key={w.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(w as any).profile?.full_name || (w as any).profile?.username}</p>
                      <p className="text-xs text-muted-foreground">{detail.bank || w.method}</p>
                      <p className="text-xs text-muted-foreground">IBAN: {detail.iban || w.method_detail}</p>
                      <p className="text-xs text-muted-foreground">BI: {detail.bi || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-AO")}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-display text-sm font-bold">{Number(w.amount).toLocaleString("pt-AO")} Kz</p>
                      <p className="text-[10px] text-muted-foreground">Taxa: {fee.toLocaleString("pt-AO")} Kz</p>
                      {statusBadge(w.status)}
                      {w.status === "pending" && (
                        <div className="flex gap-1 mt-1">
                          <Button size="sm" className="h-6 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => processWithdrawal(w.id, "approve")} disabled={processingId === w.id}>Aprovar</Button>
                          <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => processWithdrawal(w.id, "reject")} disabled={processingId === w.id}>Rejeitar</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {withdrawals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum saque registrado</p>}
          </motion.div>
        )}

        {tab === "donations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-display text-lg font-bold">Doações ({donations.length})</h2>
            {donations.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{d.donor_name || "Anônimo"}</p>
                  <p className="text-xs text-muted-foreground">{d.donor_email || "Sem email"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-AO")}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold">{Number(d.amount).toLocaleString("pt-AO")} Kz</p>
                  {statusBadge(d.status)}
                </div>
              </div>
            ))}
            {donations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma doação registrada</p>}
          </motion.div>
        )}

        {tab === "transfers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-display text-lg font-bold">Transferências ({transfers.length})</h2>
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">@{(t as any).sender?.username} → @{(t as any).receiver?.username}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-AO")}</p>
                  {t.note && <p className="text-xs text-muted-foreground italic">"{t.note}"</p>}
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold">{Number(t.amount).toLocaleString("pt-AO")} Kz</p>
                  {statusBadge(t.status)}
                </div>
              </div>
            ))}
            {transfers.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transferência registrada</p>}
          </motion.div>
        )}

        {tab === "verification" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-display text-lg font-bold">Verificação de BI ({pendingBi.length} pendentes)</h2>
            {users.filter((u: any) => u.bi_number).map((u: any) => (
              <div key={u.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username} • BI: {u.bi_number}</p>
                    {u.birth_date && <p className="text-xs text-muted-foreground">Nascimento: {u.birth_date}</p>}
                  </div>
                  {statusBadge(u.bi_verification_status || "none")}
                </div>
                {u.bi_image_url && (
                  <div className="mb-3 text-xs text-muted-foreground flex items-center gap-1">
                    <FileText size={12} /> Documento enviado
                  </div>
                )}
                {u.bi_verification_status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700" onClick={() => approveBi(u.id, "approved")}>
                      <CheckCircle size={14} className="mr-1" /> Aprovar BI
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-8" onClick={() => approveBi(u.id, "rejected")}>
                      <Ban size={14} className="mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {users.filter((u: any) => u.bi_number).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum BI submetido</p>
            )}
          </motion.div>
        )}

        {tab === "revenue" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Rendimento da Plataforma
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Saques Aprovados</p>
                <p className="mt-1 font-display text-xl font-bold text-green-600">
                  {totalWithdrawnApproved.toLocaleString("pt-AO")} Kz
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Receita (Taxa 3%)</p>
                <p className="mt-1 font-display text-xl font-bold text-purple-600">
                  {totalFees.toLocaleString("pt-AO")} Kz
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Doações</p>
                <p className="mt-1 font-display text-xl font-bold text-emerald-600">
                  {totalDonations.toLocaleString("pt-AO")} Kz
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Doações Completas</p>
                <p className="mt-1 font-display text-xl font-bold text-blue-600">
                  {completedDonations.length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-display text-sm font-bold mb-3">Saques Recentes (Aprovados)</h3>
              <div className="space-y-2">
                {withdrawals.filter(w => w.status === "approved").slice(0, 10).map(w => {
                  const fee = Math.round(w.amount * 0.03);
                  return (
                    <div key={w.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">{(w as any).profile?.full_name || "?"}</span>
                      <div className="text-right">
                        <span className="font-medium">{w.amount.toLocaleString("pt-AO")} Kz</span>
                        <span className="text-xs text-purple-600 ml-2">+{fee.toLocaleString("pt-AO")}</span>
                      </div>
                    </div>
                  );
                })}
                {withdrawals.filter(w => w.status === "approved").length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhum saque aprovado</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GhostAdmin;
