import { useState, useEffect } from "react";
import { Heart, ArrowUpRight, ArrowDownLeft, Send, Clock, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TransactionHistoryProps {
  userId: string;
}

type TransactionType = "all" | "donations" | "transfers_in" | "transfers_out" | "withdrawals";

interface Transaction {
  id: string;
  type: "donation" | "transfer_in" | "transfer_out" | "withdrawal";
  amount: number;
  label: string;
  sublabel: string;
  status: string;
  date: string;
}

const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [donationsRes, transfersRes, withdrawalsRes] = await Promise.all([
        supabase.from("donations").select("*").eq("recipient_id", userId).eq("status", "completed").order("created_at", { ascending: false }).limit(50),
        supabase.from("transfers").select("*, sender:profiles!transfers_sender_id_fkey(username, full_name), receiver:profiles!transfers_receiver_id_fkey(username, full_name)").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false }).limit(50),
        supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);

      const all: Transaction[] = [];

      (donationsRes.data || []).forEach((d: any) => {
        all.push({
          id: d.id,
          type: "donation",
          amount: d.amount,
          label: d.donor_name || "Anônimo",
          sublabel: d.message || "Doação recebida",
          status: d.status,
          date: d.created_at,
        });
      });

      (transfersRes.data || []).forEach((t: any) => {
        const isOutgoing = t.sender_id === userId;
        all.push({
          id: t.id,
          type: isOutgoing ? "transfer_out" : "transfer_in",
          amount: t.amount,
          label: isOutgoing ? (t.receiver?.full_name || t.receiver?.username || "Desconhecido") : (t.sender?.full_name || t.sender?.username || "Desconhecido"),
          sublabel: t.note || (isOutgoing ? "Transferência enviada" : "Transferência recebida"),
          status: t.status,
          date: t.created_at,
        });
      });

      (withdrawalsRes.data || []).forEach((w: any) => {
        all.push({
          id: w.id,
          type: "withdrawal",
          amount: w.amount,
          label: "Saque",
          sublabel: w.method_detail ? JSON.parse(w.method_detail)?.bank || w.method : w.method,
          status: w.status,
          date: w.created_at,
        });
      });

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(all);
      setLoading(false);
    };

    fetchAll();
  }, [userId]);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => {
    if (filter === "donations") return t.type === "donation";
    if (filter === "transfers_in") return t.type === "transfer_in";
    if (filter === "transfers_out") return t.type === "transfer_out";
    if (filter === "withdrawals") return t.type === "withdrawal";
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short" });
  };

  const getIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "donation": return <Heart size={16} className="text-primary" />;
      case "transfer_in": return <ArrowDownLeft size={16} className="text-primary" />;
      case "transfer_out": return <Send size={16} className="text-accent" />;
      case "withdrawal": return <ArrowUpRight size={16} className="text-warning" />;
    }
  };

  const getAmountColor = (type: Transaction["type"]) => {
    return type === "transfer_out" || type === "withdrawal" ? "text-destructive" : "text-primary";
  };

  const getAmountPrefix = (type: Transaction["type"]) => {
    return type === "transfer_out" || type === "withdrawal" ? "-" : "+";
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      completed: { label: "Confirmado", class: "bg-primary/10 text-primary" },
      pending: { label: "Pendente", class: "bg-warning/10 text-warning" },
      failed: { label: "Cancelado", class: "bg-destructive/10 text-destructive" },
      cancelled: { label: "Cancelado", class: "bg-destructive/10 text-destructive" },
    };
    const s = map[status] || { label: status, class: "bg-muted text-muted-foreground" };
    return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.class}`}>{s.label}</span>;
  };

  const filters: { key: TransactionType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "donations", label: "Doações" },
    { key: "transfers_in", label: "Recebidas" },
    { key: "transfers_out", label: "Enviadas" },
    { key: "withdrawals", label: "Saques" },
  ];

  return (
    <div id="history" className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-card-foreground">
          <Clock size={15} /> Histórico
        </h2>
        <span className="text-[11px] text-muted-foreground">{filtered.length} registros</span>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-border">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner h-6 w-6" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Filter size={20} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${
                  t.type === "donation" ? "bg-primary/10" : t.type === "transfer_in" ? "bg-primary/10" : t.type === "transfer_out" ? "bg-accent/10" : "bg-warning/10"
                }`}>
                  {getIcon(t.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-card-foreground truncate">{t.label}</span>
                    {getStatusBadge(t.status)}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] text-muted-foreground truncate">{t.sublabel}</span>
                    <span className="text-[10px] text-muted-foreground/70">• {formatDate(t.date)}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${getAmountColor(t.type)}`}>
                  {getAmountPrefix(t.type)}{t.amount.toLocaleString("pt-AO")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
