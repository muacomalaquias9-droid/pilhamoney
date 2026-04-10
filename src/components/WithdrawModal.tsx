import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, AlertCircle, Building2, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  userId: string;
  onSuccess: () => void;
}

const angolaBanks = [
  { id: "bai", name: "BAI - Banco Angolano de Investimentos", color: "#004B87" },
  { id: "bfa", name: "BFA - Banco de Fomento Angola", color: "#003DA5" },
  { id: "bic", name: "BIC - Banco BIC", color: "#E30613" },
  { id: "bpc", name: "BPC - Banco de Poupança e Crédito", color: "#00529B" },
  { id: "bma", name: "BMA - Banco Millennium Atlântico", color: "#6F2C91" },
  { id: "bni", name: "BNI - Banco de Negócios Internacional", color: "#002D62" },
  { id: "sol", name: "Banco SOL", color: "#F7941D" },
  { id: "keve", name: "Banco Keve", color: "#009640" },
  { id: "yetu", name: "Banco Yetu", color: "#0072BC" },
  { id: "outro", name: "Outro banco angolano", color: "#666666" },
];

const WithdrawModal = ({ open, onClose, balance, userId, onSuccess }: WithdrawModalProps) => {
  const [step, setStep] = useState<"bank" | "form">("bank");
  const [selectedBank, setSelectedBank] = useState<typeof angolaBanks[0] | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [iban, setIban] = useState("");
  const [biNumber, setBiNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep("bank");
    setSelectedBank(null);
    setWithdrawAmount("");
    setIban("");
    setBiNumber("");
    setFullName("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 10000) { toast.error("Valor mínimo de saque é 10.000 AOA"); return; }
    if (amt > balance) { toast.error("Saldo insuficiente"); return; }
    if (!iban.trim() || iban.trim().length < 10) { toast.error("IBAN inválido"); return; }
    if (!biNumber.trim() || biNumber.trim().length < 8) { toast.error("Número do BI inválido"); return; }
    if (!fullName.trim()) { toast.error("Nome completo obrigatório"); return; }

    setSubmitting(true);
    try {
      const methodDetail = JSON.stringify({
        bank: selectedBank?.name,
        iban: iban.trim(),
        bi: biNumber.trim(),
        full_name: fullName.trim(),
      });

      const { error } = await supabase.from("withdrawals" as any).insert({
        user_id: userId,
        amount: Math.round(amt),
        method: `iban_${selectedBank?.id}`,
        method_detail: methodDetail,
        status: "pending",
      } as any);

      if (error) throw error;
      toast.success("Saque solicitado! Será processado manualmente em até 24h.");
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 p-0 sm:p-4" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            {step === "form" && (
              <button onClick={() => setStep("bank")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="font-display text-xl font-bold text-card-foreground">
              {step === "bank" ? "Sacar via IBAN" : `Sacar para ${selectedBank?.name.split(" - ")[0]}`}
            </h2>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <AlertCircle size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Saldo: <strong className="text-foreground">{balance.toLocaleString("pt-AO")} AOA</strong>
            </span>
          </div>

          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">⚠️ Saque manual:</strong> Taxa de 3% aplicada. Os saques são processados e transferidos para o seu IBAN via PlinqPay. Prazo: até 24h úteis.
            </p>
            {withdrawAmount && Number(withdrawAmount) >= 10000 && (
              <div className="mt-2 text-xs space-y-0.5">
                <p className="text-muted-foreground">Valor: <strong className="text-foreground">{Number(withdrawAmount).toLocaleString("pt-AO")} AOA</strong></p>
                <p className="text-muted-foreground">Taxa (3%): <strong className="text-foreground">{Math.round(Number(withdrawAmount) * 0.03).toLocaleString("pt-AO")} AOA</strong></p>
                <p className="text-muted-foreground">Você recebe: <strong className="text-primary">{Math.round(Number(withdrawAmount) * 0.97).toLocaleString("pt-AO")} AOA</strong></p>
              </div>
            )}
          </div>

          {step === "bank" ? (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {angolaBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => { setSelectedBank(bank); setStep("form"); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-[8px] font-bold" style={{ backgroundColor: bank.color }}>
                    <Building2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground truncate">{bank.name}</div>
                    <div className="text-xs text-muted-foreground">Transferência via IBAN</div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Valor do saque (AOA)</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="10000"
                    max={balance}
                    placeholder="0"
                    className="h-12 pr-14 text-xl font-bold"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">AOA</span>
                </div>
                <button type="button" onClick={() => setWithdrawAmount(String(balance))} className="mt-1 text-xs text-primary hover:underline">
                  Sacar tudo
                </button>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                  <FileText size={14} /> Nome completo (titular da conta)
                </label>
                <Input placeholder="Nome conforme BI" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" required />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                  <FileText size={14} /> Número do BI
                </label>
                <Input placeholder="00XXXXXXXXLA0XX" value={biNumber} onChange={(e) => setBiNumber(e.target.value)} className="h-11" required />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                  <CreditCard size={14} /> IBAN
                </label>
                <Input placeholder="AO06 0000 0000 0000 0000 0000 0" value={iban} onChange={(e) => setIban(e.target.value)} className="h-11" required />
                <p className="mt-1 text-xs text-muted-foreground">IBAN da sua conta no {selectedBank?.name.split(" - ")[0]}</p>
              </div>

              <Button type="submit" className="w-full rounded-xl" size="lg" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="loading-spinner h-4 w-4" /> Processando...
                  </span>
                ) : (
                  `Solicitar saque de ${withdrawAmount ? Number(withdrawAmount).toLocaleString("pt-AO") : "0"} AOA`
                )}
              </Button>
            </form>
          )}

          <Button variant="outline" className="mt-3 w-full" onClick={handleClose}>Fechar</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default WithdrawModal;
