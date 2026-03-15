import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserCount } from "@/hooks/useUserCount";

const HeroSection = () => {
  const userCount = useUserCount();

  return (
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

            {/* Real-time user count */}
            <div className="mt-10 flex items-center gap-5">
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
                <span className="font-semibold text-foreground">
                  {userCount > 0 ? `+${userCount}` : "+0"}
                </span>{" "}
                criadores já usam
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
            {/* Floating element */}
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
  );
};

export default HeroSection;
