import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, Shield, Zap, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Zap,
    title: "Pagamentos Instantâneos",
    description: "Envie e receba dinheiro em tempo real com segurança total.",
  },
  {
    icon: CreditCard,
    title: "Visa & MasterCard",
    description: "Aceite pagamentos de qualquer cartão Visa ou MasterCard.",
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Transações protegidas com criptografia de ponta.",
  },
  {
    icon: Send,
    title: "Saques Rápidos",
    description: "Saque para Bybit, Binance, Redotpay ou cartão bancário.",
  },
];

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-green" />
              Pagamentos em tempo real
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Envie dinheiro de forma{" "}
              <span className="text-primary">rápida e segura</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              A plataforma mais simples para enviar e receber pagamentos.
              Aceite Visa e MasterCard, saque instantaneamente.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth?tab=register">
                <Button size="lg" className="gap-2 text-base px-8">
                  Começar agora <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center font-display text-3xl font-bold text-foreground"
          >
            Tudo que você precisa
          </motion.h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-2xl bg-primary p-10 text-primary-foreground shadow-lg"
          >
            <h2 className="mb-4 font-display text-3xl font-bold">
              Crie sua conta gratuita
            </h2>
            <p className="mb-6 opacity-90">
              Receba seu link pessoal e comece a receber pagamentos hoje.
            </p>
            <Link to="/auth?tab=register">
              <Button size="lg" variant="secondary" className="gap-2 text-base">
                Criar conta <ArrowRight size={18} />
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
