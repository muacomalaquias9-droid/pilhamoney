import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Ban, Lock, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const PAGE_SIZE = 5;

type Incident = {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  incident_type: string;
  severity: string;
  ai_analysis: string | null;
  ai_score: number | null;
  action_taken: string | null;
  created_at: string;
};

type LoginAttempt = {
  id: string;
  email: string | null;
  ip_address: string | null;
  country: string | null;
  reason: string | null;
  created_at: string;
};

type BanInfo = { is_banned: boolean; ban_reason: string | null };

interface Props {
  userId: string;
  isAdmin: boolean;
}

export default function CriticalAlerts({ userId, isAdmin }: Props) {
  const [ban, setBan] = useState<BanInfo | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [failedLogins, setFailedLogins] = useState<LoginAttempt[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"incidents" | "logins">("incidents");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);

      // 1. Ban status (sempre para o próprio user)
      const { data: sec } = await supabase
        .from("user_security")
        .select("is_banned, ban_reason")
        .eq("user_id", userId)
        .maybeSingle();
      if (mounted) setBan(sec as BanInfo | null);

      // 2. Incidentes — admin vê tudo, user vê só os seus
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let incQuery = supabase
        .from("abuse_incidents")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!isAdmin) incQuery = incQuery.eq("user_id", userId);

      const { data: incData, count } = await incQuery;
      if (mounted) {
        setIncidents((incData as Incident[]) || []);
        setTotal(count || 0);
      }

      // 3. Login attempts (admin only)
      if (isAdmin) {
        const { data: logins } = await supabase
          .from("login_attempts")
          .select("*")
          .eq("success", false)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (mounted) setFailedLogins((logins as LoginAttempt[]) || []);
      }

      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [userId, isAdmin, page, tab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sevColor = (s: string) =>
    s === "critical" ? "text-red-600 bg-red-500/10 border-red-500/30"
    : s === "high" ? "text-orange-600 bg-orange-500/10 border-orange-500/30"
    : s === "medium" ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
    : "text-muted-foreground bg-muted border-border";

  // Não mostra nada se não há nada para mostrar
  if (loading) return null;
  const hasAnything = ban?.is_banned || incidents.length > 0 || (isAdmin && failedLogins.length > 0);
  if (!hasAnything) return null;

  return (
    <div className="space-y-3">
      {/* Banner crítico se conta banida */}
      {ban?.is_banned && (
        <Alert variant="destructive" className="border-red-500/40">
          <Ban className="h-4 w-4" />
          <AlertTitle>Conta suspensa</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <p>{ban.ban_reason || "A sua conta foi suspensa pelo sistema de segurança. Contacte o suporte."}</p>
            <Link
              to={`/support?category=ban_appeal&reason=${encodeURIComponent(ban.ban_reason || "Conta suspensa pelo sistema")}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:opacity-90"
            >
              <MessageCircle size={12} /> Fale com o Suporte IA
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              {isAdmin ? "Alertas de segurança (admin)" : "Alertas de segurança"}
            </h3>
          </div>
          {isAdmin && (
            <div className="flex gap-1 rounded-lg bg-muted p-0.5 text-xs">
              <button
                onClick={() => { setTab("incidents"); setPage(0); }}
                className={`rounded px-2 py-1 ${tab === "incidents" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
              >Incidentes</button>
              <button
                onClick={() => { setTab("logins"); setPage(0); }}
                className={`rounded px-2 py-1 ${tab === "logins" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
              >Logins falhados</button>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {(isAdmin && tab === "logins" ? failedLogins.length === 0 : incidents.length === 0) && (
            <p className="py-4 text-center text-xs text-muted-foreground">Sem eventos para mostrar.</p>
          )}

          {(!isAdmin || tab === "incidents") && incidents.map((it) => (
            <div key={it.id} className={`rounded-lg border p-3 ${sevColor(it.severity)}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-semibold uppercase">{it.incident_type}</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">
                  {formatDistanceToNow(new Date(it.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {it.ai_analysis && (
                <p className="mt-1 text-xs leading-relaxed opacity-90 line-clamp-2">{it.ai_analysis}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] opacity-70">
                {typeof it.ai_score === "number" && <span>Risco: {it.ai_score}/100</span>}
                {it.action_taken && <span>• {it.action_taken}</span>}
                {isAdmin && it.ip_address && <span>• IP {it.ip_address}</span>}
              </div>
            </div>
          ))}

          {isAdmin && tab === "logins" && failedLogins.map((it) => (
            <div key={it.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-orange-500" />
                  <span className="text-xs font-medium text-foreground">{it.email || "—"}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {formatDistanceToNow(new Date(it.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <span>IP {it.ip_address || "?"}</span>
                {it.country && <span>• {it.country}</span>}
                {it.reason && <span>• {it.reason}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (!isAdmin || tab === "incidents") && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">
              Página {page + 1} de {totalPages} • {total} no total
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7"
                disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7"
                disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}