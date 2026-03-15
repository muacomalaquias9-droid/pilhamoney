import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, CreditCard, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    setLoading(true);
    // Will connect to Stripe
    setTimeout(() => {
      setLoading(false);
      toast.info("Pagamentos serão habilitados com Stripe. Habilite Lovable Cloud primeiro.");
    }, 1000);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Pagamento enviado!</h1>
          <p className="text-muted-foreground">
            ${parseFloat(amount).toFixed(2)} enviado para @{username}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <div className="container mx-auto max-w-lg px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>

            {/* User info */}
            <div className="mb-8">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="font-display text-2xl font-bold text-primary">
                  {(username || "U")[0].toUpperCase()}
                </span>
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">
                @{username}
              </h1>
              <p className="text-sm text-muted-foreground">Envie um pagamento seguro</p>
            </div>

            {/* Payment form */}
            <Card className="text-left">
              <form onSubmit={handlePayment} className="space-y-4 p-6">
                <div>
                  <Label htmlFor="amount">Valor (USD)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.50"
                      placeholder="0.00"
                      className="pl-8 text-2xl font-bold h-14"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="flex items-center gap-1">
                    <MessageSquare size={14} /> Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Escreva uma mensagem..."
                    className="mt-1 resize-none"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>

                {/* Card types */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
                    <CreditCard size={14} /> Visa
                  </div>
                  <div className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">
                    <CreditCard size={14} /> MasterCard
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="loading-spinner h-4 w-4" /> Processando...
                    </span>
                  ) : (
                    <>
                      <Send size={18} /> Enviar Pagamento
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Pagamento seguro processado pelo Stripe. Aceita Visa e MasterCard.
                </p>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Simple card wrapper since we import from ui
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
    {children}
  </div>
);

export default UserProfile;
