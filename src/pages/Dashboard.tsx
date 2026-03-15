import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Send, CreditCard,
  Copy, LogOut, User, Settings, Bell, TrendingUp, ChevronRight,
  DollarSign, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

// Mock data - will be replaced with real data from Lovable Cloud
const mockUser = {
  name: "Isaac Muaco",
  username: "isaacmuaco582",
  email: "isaac@email.com",
  balance: 0,
  totalReceived: 0,
  totalSent: 0,
};

const mockTransactions: Array<{
  id: string;
  type: "received" | "sent" | "withdrawal";
  amount: number;
  from?: string;
  to?: string;
  message?: string;
  date: string;
}> = [];

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${mockUser.username}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings size={18} />
            </Button>
            <Link to="/">
              <Button variant="ghost" size="icon">
                <LogOut size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl font-bold text-foreground">
            Olá, {mockUser.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie sua carteira Pilha-Money
          </p>
        </motion.div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                {showBalance ? `$${mockUser.balance.toFixed(2)}` : "••••••"}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-70">@{mockUser.username}</span>
                <button onClick={copyLink} className="opacity-70 hover:opacity-100">
                  <Copy size={14} />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Send size={18} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-card-foreground">Receber</span>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
              <ArrowUpRight size={18} className="text-accent" />
            </div>
            <span className="text-xs font-medium text-card-foreground">Sacar</span>
          </button>
          <Link
            to={`/@${mockUser.username}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <User size={18} className="text-success" />
            </div>
            <span className="text-xs font-medium text-card-foreground">Perfil</span>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 grid gap-3 sm:grid-cols-2"
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowDownLeft size={18} className="text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Recebido</div>
                <div className="font-display text-lg font-bold text-card-foreground">
                  ${mockUser.totalReceived.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <TrendingUp size={18} className="text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Enviado</div>
                <div className="font-display text-lg font-bold text-card-foreground">
                  ${mockUser.totalSent.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign size={18} /> Transações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockTransactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  <p>Nenhuma transação ainda</p>
                  <p className="text-xs mt-1">Compartilhe seu link para receber pagamentos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          tx.type === "received" ? "bg-success/10" : "bg-destructive/10"
                        }`}>
                          {tx.type === "received" ? (
                            <ArrowDownLeft size={14} className="text-success" />
                          ) : (
                            <ArrowUpRight size={14} className="text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-card-foreground">
                            {tx.type === "received" ? `De ${tx.from}` : `Para ${tx.to}`}
                          </div>
                          {tx.message && (
                            <div className="text-xs text-muted-foreground">{tx.message}</div>
                          )}
                        </div>
                      </div>
                      <div className={`font-medium ${
                        tx.type === "received" ? "text-success" : "text-destructive"
                      }`}>
                        {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdraw Modal Placeholder */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg"
            >
              <h2 className="mb-4 font-display text-xl font-bold text-card-foreground">Sacar Fundos</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Funcionalidade de saque será habilitada com Stripe e Lovable Cloud.
              </p>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 opacity-60">
                  <CreditCard size={18} className="text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-card-foreground">Bybit / Binance</div>
                    <div className="text-xs text-muted-foreground">Via e-mail da conta</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 opacity-60">
                  <CreditCard size={18} className="text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-card-foreground">Redotpay</div>
                    <div className="text-xs text-muted-foreground">Via número do cartão</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 opacity-60">
                  <CreditCard size={18} className="text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-card-foreground">Visa / MasterCard</div>
                    <div className="text-xs text-muted-foreground">Direto no cartão</div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowWithdrawModal(false)}>
                Fechar
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
