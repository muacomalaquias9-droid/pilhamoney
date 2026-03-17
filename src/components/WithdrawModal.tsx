import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balance: number; // in dollars
  userId: string;
  onSuccess: () => void;
}

const methods = [
  { id: "bybit", name: "Bybit", desc: "Via e-mail da conta", placeholder: "E-mail da sua conta Bybit", icon: "BYBIT", color: "#F7A600" },
  { id: "binance", name: "Binance", desc: "Via e-mail da conta", placeholder: "E-mail da sua conta Binance", icon: "BINANCE", color: "#F3BA2F" },
  { id: "redotpay", name: "RedotPay", desc: "Via número do cartão", placeholder: "Número do cartão RedotPay", icon: "RedotPay", color: "#FF4444" },
  { id: "visa", name: "Visa", desc: "Direto no cartão", placeholder: "Número do cartão Visa", icon: "VISA", color: "#1A1F71" },
  { id: "mastercard", name: "MasterCard", desc: "Direto no cartão", placeholder: "Número do cartão MasterCard", icon: "MC", color: "#EB001B" },
];

const WithdrawModal = ({ open, onClose, balance, userId, onSuccess }: WithdrawModalProps) => {
  const [step, setStep] = useState<"method" | "form">("method");
  const [selectedMethod, setSelectedMethod] = useState<typeof methods[0] | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [methodDetail, setMethodDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep("method");
    setSelectedMethod(null);
    setWithdrawAmount("");
    setMethodDetail("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectMethod = (m: typeof methods[0]) => {
    setSelectedMethod(m);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 1) {
      toast.error("Valor mínimo é $1.00");
      return;
    }
    if (amt > balance) {
      toast.error("Saldo insuficiente");
      return;
    }
    if (!methodDetail.trim()) {
      toast.error("Preencha os dados do método de saque");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals" as any).insert({
        user_id: userId,
        amount: Math.round(amt * 100),
        method: selectedMethod!.id,
        method_detail: methodDetail.trim(),
        status: "pending",
      } as any);

      if (error) throw error;

      toast.success("Saque solicitado! Será processado em até 24h.");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar saque");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          {step === "form" && (
            <button onClick={() => setStep("method")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="font-display text-xl font-bold text-card-foreground">
            {step === "method" ? "Sacar Fundos" : `Sacar via ${selectedMethod?.name}`}
          </h2>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <AlertCircle size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Saldo disponível: <strong className="text-foreground">${balance.toFixed(2)}</strong></span>
        </div>

        {step === "method" ? (
          <div className="space-y-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMethod(m)}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-card-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Valor do saque</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={balance}
                  placeholder="0.00"
                  className="h-12 pl-8 text-xl font-bold"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(balance.toFixed(2))}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Sacar tudo
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                {selectedMethod?.placeholder?.split(" ").slice(0, 2).join(" ") || "Dados"}
              </label>
              <Input
                placeholder={selectedMethod?.placeholder}
                value={methodDetail}
                onChange={(e) => setMethodDetail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <Button type="submit" className="w-full rounded-xl" size="lg" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="loading-spinner h-4 w-4" /> Processando...
                </span>
              ) : (
                `Solicitar saque de $${withdrawAmount || "0.00"}`
              )}
            </Button>
          </form>
        )}

        <Button variant="outline" className="mt-3 w-full" onClick={handleClose}>Fechar</Button>
      </motion.div>
    </div>
  );
};

export default WithdrawModal;
