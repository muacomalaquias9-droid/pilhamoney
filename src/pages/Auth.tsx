import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ChevronRight } from "lucide-react";
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

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

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
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        if (!form.username || form.username.length < 3) {
          toast.error("Nome de utilizador deve ter pelo menos 3 caracteres.");
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

        const { error } = await supabase.auth.signUp({
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
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setIsLogin(!isLogin);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-primary p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <Logo size="lg" />
          <p className="mt-3 text-sm opacity-80 max-w-xs">
            A plataforma de doações mais simples e segura de Angola.
          </p>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm p-6 border border-primary-foreground/10">
            <p className="text-lg font-medium leading-relaxed">
              "Recebi minha primeira doação em menos de 5 minutos. Incrível!"
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-sm">
                AM
              </div>
              <div>
                <div className="text-sm font-semibold">Ana Maria</div>
                <div className="text-xs opacity-70">Criadora de conteúdo</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-xs opacity-60">
          © {new Date().getFullYear()} Pilha-Money
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Voltar
          </Link>

          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
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
                          Seu link: pilhamoney.lovable.app/@{form.username}
                        </p>
                      )}
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
