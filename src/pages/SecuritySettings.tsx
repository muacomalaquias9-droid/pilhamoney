import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Smartphone, Lock, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

const SecuritySettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase.functions.invoke("totp-setup", {
        body: { action: "status" },
      });
      setTotpEnabled(data?.totp_enabled || false);
      setChecking(false);
    };
    check();
  }, [user]);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "setup" },
      });
      if (error) throw error;
      setSetupData(data);
    } catch (err: any) {
      toast.error(err.message || "Erro ao configurar 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "enable", code: verifyCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTotpEnabled(true);
      setSetupData(null);
      setVerifyCode("");
      toast.success("2FA ativado com sucesso! 🔒");
    } catch (err: any) {
      toast.error(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "disable" },
      });
      if (error) throw error;
      setTotpEnabled(false);
      toast.success("2FA desativado");
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar 2FA");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <Logo size="sm" />
          <div className="w-16" />
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" /> Segurança
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Proteja sua conta com autenticação de dois fatores
          </p>

          {/* 2FA Status */}
          <div className="rounded-2xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${totpEnabled ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                {totpEnabled ? <Lock size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 className="font-display font-bold text-card-foreground">
                  Autenticação 2FA (TOTP)
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totpEnabled ? "Ativado — sua conta está protegida" : "Desativado — recomendamos ativar"}
                </p>
              </div>
            </div>

            {totpEnabled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <CheckCircle size={16} className="text-primary" />
                  <span className="text-sm text-primary font-medium">Autenticação de dois fatores está ativa</span>
                </div>
                <Button variant="outline" className="w-full" onClick={handleDisable} disabled={loading}>
                  {loading ? "Desativando..." : "Desativar 2FA"}
                </Button>
              </div>
            ) : setupData ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <Smartphone size={32} className="mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-card-foreground mb-2">
                    Escaneie com Google Authenticator
                  </p>
                  <div className="rounded-lg bg-card border border-border p-4 mb-3">
                    <p className="font-mono text-xs break-all text-muted-foreground">{setupData.secret}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ou copie o código acima e adicione manualmente no app autenticador
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-card-foreground">Código de verificação</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center text-2xl font-bold tracking-[0.5em] rounded-xl"
                  />
                </div>

                <Button className="w-full h-12 rounded-xl" onClick={handleEnable} disabled={loading || verifyCode.length !== 6}>
                  {loading ? "Verificando..." : "Ativar 2FA"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSetupData(null)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button className="w-full h-12 rounded-xl gap-2" onClick={handleSetup} disabled={loading}>
                <Smartphone size={18} />
                {loading ? "Gerando..." : "Configurar 2FA com App Autenticador"}
              </Button>
            )}
          </div>

          {/* Security Info */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display font-bold text-card-foreground mb-3">Dicas de segurança</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                Use senha forte e única para sua conta
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                Ative 2FA para proteger saques e transferências
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                Nunca compartilhe seu código de autenticação
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                Limite diário de transferência: 500.000 AOA
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SecuritySettings;
