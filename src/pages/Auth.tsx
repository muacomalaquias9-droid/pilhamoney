import { useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ChevronRight, Smartphone, Calendar, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [biFile, setBiFile] = useState<File | null>(null);
  const [biPreview, setBiPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    birthDate: "",
    biNumber: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem do BI deve ter no máximo 5MB");
        return;
      }
      setBiFile(file);
      setBiPreview(URL.createObjectURL(file));
    }
  };

  const validateAge = (dateStr: string): boolean => {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 16;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        const { data: secData } = await supabase.functions.invoke("totp-setup", {
          body: { action: "status" },
        });

        if (secData?.totp_enabled) {
          setNeeds2FA(true);
          setLoading(false);
          return;
        }

        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        if (!form.username || form.username.length < 3) {
          toast.error("Nome de utilizador deve ter pelo menos 3 caracteres.");
          setLoading(false);
          return;
        }

        if (!form.birthDate) {
          toast.error("Data de nascimento é obrigatória.");
          setLoading(false);
          return;
        }

        if (!validateAge(form.birthDate)) {
          toast.error("Você deve ter pelo menos 16 anos para criar uma conta.");
          setLoading(false);
          return;
        }

        if (!form.biNumber || form.biNumber.length < 8) {
          toast.error("Número do BI é obrigatório (mínimo 8 caracteres).");
          setLoading(false);
          return;
        }

        if (!biFile) {
          toast.error("Foto do BI é obrigatória para verificação.");
          setLoading(false);
          return;
        }

        // Check if username is taken
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", form.username)
          .maybeSingle();

        if (existing) {
          toast.error("Esse nome de utilizador já está em uso.");
          setLoading(false);
          return;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              username: form.username,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Upload BI image
        if (signUpData.user) {
          const filePath = `${signUpData.user.id}/bi.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("identity-docs")
            .upload(filePath, biFile, { upsert: true });

          if (uploadError) {
            console.error("BI upload error:", uploadError);
          } else {
            // Trigger AI verification
            try {
              await supabase.functions.invoke("verify-bi", {
                body: {
                  bi_image_url: filePath,
                  full_name: form.name,
                  birth_date: form.birthDate,
                  bi_number: form.biNumber,
                },
              });
            } catch (verifyErr) {
              console.error("BI verification error:", verifyErr);
            }
          }
        }

        toast.success("Conta criada! Verifique seu e-mail para confirmar. Seu BI está sendo verificado.");
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (totpCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "verify_login", code: totpCode },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setIsLogin(!isLogin);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f5f5f5", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "380px", margin: "30px auto", background: "white", padding: "20px", border: "1px solid #ccc", borderRadius: "4px" }}>
        <Link to="/" style={{ color: "#0066cc", fontSize: "13px", textDecoration: "underline" }}>Voltar</Link>
        <h2 style={{ marginTop: "15px", marginBottom: "5px", color: "#222" }}>Pilha Money</h2>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>Carteira digital</p>

          {needs2FA ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Smartphone size={32} className="text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Verificação 2FA</h1>
                <p className="text-center text-sm text-muted-foreground">
                  Abra o Google Authenticator e digite o código de 6 dígitos
                </p>
              </div>

              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="h-14 text-center text-3xl font-bold tracking-[0.5em] rounded-xl"
              />

              <Button
                className="w-full h-12 rounded-xl gap-2"
                onClick={handle2FAVerify}
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? "Verificando..." : "Confirmar"}
                <ChevronRight size={16} />
              </Button>

              <button
                onClick={() => { setNeeds2FA(false); setTotpCode(""); supabase.auth.signOut(); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar ao login
              </button>
            </motion.div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                {isLogin ? "Entrar na conta" : "Criar conta"}
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                {isLogin
                  ? "Insira suas credenciais para acessar sua carteira."
                  : "Preencha os dados abaixo para começar a receber doações."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          id="name"
                          placeholder="Ex: Isaac Muaco"
                          className="h-11 pl-10 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="username" className="text-sm font-medium text-foreground">
                        Nome de utilizador
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/60">@</span>
                        <Input
                          id="username"
                          placeholder="seuusuario"
                          className="h-11 pl-8 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                          value={form.username}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                            })
                          }
                          required
                          minLength={3}
                        />
                      </div>
                      {form.username && (
                        <p className="text-xs text-muted-foreground">
                          Seu link: pilha-money.com/@{form.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="birthDate" className="text-sm font-medium text-foreground">
                        Data de nascimento
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          id="birthDate"
                          type="date"
                          className="h-11 pl-10 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                          value={form.birthDate}
                          onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                          required
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Mínimo 16 anos de idade</p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="biNumber" className="text-sm font-medium text-foreground">
                        Número do BI
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          id="biNumber"
                          placeholder="00XXXXXXXXLA0XX"
                          className="h-11 pl-10 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                          value={form.biNumber}
                          onChange={(e) => setForm({ ...form, biNumber: e.target.value })}
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Foto do BI (frente)
                      </label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-secondary/40 p-4 text-left hover:bg-secondary/60 transition-colors"
                      >
                        {biPreview ? (
                          <img src={biPreview} alt="BI Preview" className="h-16 w-24 object-cover rounded-lg" />
                        ) : (
                          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-muted">
                            <Upload size={24} className="text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {biFile ? biFile.name : "Carregar foto do BI"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {biFile ? "Clique para trocar" : "JPG, PNG até 5MB"}
                          </p>
                        </div>
                      </button>
                      <p className="text-xs text-muted-foreground">
                        🔒 A IA verificará se o nome e BI correspondem ao cadastro
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@email.com"
                      className="h-11 pl-10 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Senha
                    </label>
                    {isLogin && (
                      <button type="button" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      className="h-11 pl-10 pr-10 bg-secondary/40 border-border/60 focus:bg-background transition-colors"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gap-2 text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="loading-spinner h-4 w-4" /> Processando...
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Entrar" : "Criar conta"}
                      <ChevronRight size={16} />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-sm text-muted-foreground">
                  {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
                </span>
                <button
                  onClick={toggle}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {isLogin ? "Criar conta" : "Entrar"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
