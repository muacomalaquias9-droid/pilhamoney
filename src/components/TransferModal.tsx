import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Send, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  userId: string;
  onSuccess: () => void;
}

const quickAmounts = [500, 1000, 2500, 5000, 10000];

const TransferModal = ({ open, onClose, balance, userId, onSuccess }: TransferModalProps) => {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  useEffect(() => {
    if (!receiver || receiver.length < 3) {
      setSearchResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const identifier = receiver.replace(/^@/, "");
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      let data = null;
      if (uuidRegex.test(identifier)) {
        const res = await supabase.from("profiles").select("id, username, full_name, avatar_url").eq("id", identifier).maybeSingle();
        data = res.data;
      }
      if (!data) {
        const res = await supabase.from("profiles").select("id, username, full_name, avatar_url").eq("username", identifier).maybeSingle();
        data = res.data;
      }
      if (data && data.id === userId) data = null;
      setSearchResult(data);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [receiver, userId]);

  const reset = () => {
    setReceiver("");
    setAmount("");
    setNote("");
    setSearchResult(null);
    setStep("form");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleConfirm = () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { toast.error("Valor mínimo é 100 AOA"); return; }
    if (amt > balance) { toast.error("Saldo insuficiente"); return; }
    if (!searchResult) { toast.error("Destinatário não encontrado"); return; }
    setStep("confirm");
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("internal-transfer", {
        body: {
          receiver_identifier: searchResult.username,
          amount: Math.round(parseFloat(amount)),
          note,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));

      toast.success(`${parseFloat(amount).toLocaleString("pt-AO")} AOA enviados para @${searchResult.username}!`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao transferir");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const initial = searchResult ? (searchResult.full_name || searchResult.username || "U")[0].toUpperCase() : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 p-0 sm:p-4" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-card-foreground">Transferir</h2>
            <button onClick={handleClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
              <X size={18} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Balance */}
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                  <AlertCircle size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Saldo: <strong className="text-foreground">{balance.toLocaleString("pt-AO")} AOA</strong>
                  </span>
                </div>

                {/* Receiver */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Destinatário</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="@username ou UUID"
                      value={receiver}
                      onChange={(e) => setReceiver(e.target.value)}
                      className="h-12 pl-10 rounded-xl"
                    />
                  </div>
                  {searching && <p className="mt-1 text-xs text-muted-foreground">Buscando...</p>}
                  {searchResult && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {searchResult.avatar_url ? (
                          <img src={searchResult.avatar_url} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <span className="font-display font-bold text-primary">{initial}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-card-foreground">{searchResult.full_name}</div>
                        <div className="text-xs text-muted-foreground">@{searchResult.username}</div>
                      </div>
                    </div>
                  )}
                  {receiver.length >= 3 && !searching && !searchResult && (
                    <p className="mt-1 text-xs text-destructive">Usuário não encontrado</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Valor (AOA)</label>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {quickAmounts.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        className={`rounded-xl py-2 text-xs font-bold transition-all ${
                          amount === String(v) ? "bg-primary/10 text-primary border-2 border-primary" : "bg-muted text-foreground border-2 border-transparent"
                        }`}
                      >
                        {v >= 1000 ? `${v / 1000}k` : v}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="100"
                      max={balance}
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pr-14 text-xl font-bold rounded-xl"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">AOA</span>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Nota (opcional)</label>
                  <Textarea
                    placeholder="Para que é esta transferência?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-none rounded-xl"
                    rows={2}
                    maxLength={200}
                  />
                </div>

                <Button className="w-full h-12 rounded-xl gap-2 text-base font-bold" onClick={handleConfirm} disabled={!searchResult || !amount}>
                  <Send size={18} /> Continuar
                </Button>
              </motion.div>
            ) : (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {searchResult?.avatar_url ? (
                      <img src={searchResult.avatar_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <User size={28} className="text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Enviar para</p>
                  <p className="font-display text-lg font-bold text-card-foreground">{searchResult?.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{searchResult?.username}</p>
                  <div className="mt-4 font-display text-3xl font-bold text-primary">
                    {parseFloat(amount).toLocaleString("pt-AO")} <span className="text-lg text-muted-foreground">AOA</span>
                  </div>
                  {note && <p className="mt-2 text-sm text-muted-foreground italic">"{note}"</p>}
                </div>

                <Button className="w-full h-12 rounded-xl gap-2 text-base font-bold" onClick={handleTransfer} disabled={loading}>
                  {loading ? <span className="flex items-center gap-2"><span className="loading-spinner h-4 w-4" /> Enviando...</span> : "Confirmar transferência"}
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep("form")}>
                  Voltar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default TransferModal;
