import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Shield, Zap, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero — asymmetric layout */}
      <section className="relative overflow-hidden py-16 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Plataforma de Doações
              </span>
              <h1 className="mb-5 font-display text-4xl font-bold leading-[1.1] text-foreground md:text-5xl lg:text-6xl">
                Receba doações de qualquer lugar do mundo
              </h1>
              <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                Crie seu perfil, compartilhe seu link e receba doações via Visa e MasterCard. Simples, seguro e instantâneo.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/auth?tab=register">
                  <Button size="lg" className="gap-2 rounded-full px-8 text-base">
                    Criar minha conta <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                    Entrar
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {["I", "M", "A", "J"].map((letter, i) => (
                    <div
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-bold text-primary"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">+200</span> criadores já usam
                </div>
              </div>
            </motion.div>

            {/* Hero visual — donation card mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto w-full max-w-sm"
            >
              <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/5">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-display text-xl font-bold text-primary">I</span>
                  </div>
                  <div>
                    <div className="font-display text-base font-bold text-card-foreground">Isaac Muaco</div>
                    <div className="text-sm text-muted-foreground">@isaacmuaco582</div>
                  </div>
                </div>
                <div className="mb-4 rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="mb-1 text-xs text-muted-foreground">Valor da doação</div>
                  <div className="font-display text-4xl font-bold text-foreground">$25.00</div>
                </div>
                <div className="mb-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  💬 Ótimo trabalho, continue assim!
                </div>
                <div className="rounded-xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground">
                  <Heart className="mr-2 inline h-4 w-4" /> Enviar Doação
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield size={12} /> Pagamento seguro via Stripe
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -right-4 -top-4 rounded-2xl border border-border bg-card px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs">✓</span>
                  <span className="font-medium text-card-foreground">$50 recebido!</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-lg text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">
              Como funciona
            </h2>
            <p className="text-muted-foreground">
              Em 3 passos simples, comece a receber doações de apoiadores
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Users,
                title: "Crie sua conta",
                desc: "Cadastre-se e receba seu link pessoal único para compartilhar.",
              },
              {
                step: "02",
                icon: Globe,
                title: "Compartilhe seu link",
                desc: "Divulgue nas redes sociais, bio do Instagram, YouTube, etc.",
              },
              {
                step: "03",
                icon: Heart,
                title: "Receba doações",
                desc: "Seus apoiadores doam com Visa ou MasterCard. O dinheiro vai direto para sua carteira.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative rounded-2xl border border-border bg-card p-8"
              >
                <span className="mb-4 block font-display text-4xl font-bold text-primary/20">
                  {item.step}
                </span>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-card-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Instantâneo", desc: "Doações processadas em tempo real" },
              { icon: Shield, title: "100% Seguro", desc: "Protegido com Stripe e criptografia" },
              { icon: Heart, title: "Sem taxas ocultas", desc: "Transparência total nas transações" },
              { icon: Star, title: "Saques rápidos", desc: "Retire para Bybit, Binance ou cartão" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-card-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-14"
          >
            <img src={logo} alt="Pilha-Money" className="mx-auto mb-6 h-16 w-16" />
            <h2 className="mb-3 font-display text-3xl font-bold">
              Comece a receber doações hoje
            </h2>
            <p className="mb-8 text-base opacity-90">
              Crie sua conta gratuita e tenha seu link pessoal em segundos.
            </p>
            <Link to="/auth?tab=register">
              <Button size="lg" variant="secondary" className="gap-2 rounded-full px-10 text-base">
                Criar conta grátis <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
