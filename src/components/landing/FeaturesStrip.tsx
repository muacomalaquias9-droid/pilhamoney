import { motion } from "framer-motion";
import { Zap, Shield, Heart, Star } from "lucide-react";

const features = [
  { icon: Zap, title: "Instantâneo", desc: "Doações processadas em tempo real" },
  { icon: Shield, title: "100% Seguro", desc: "Protegido com Stripe e criptografia" },
  { icon: Heart, title: "Sem taxas ocultas", desc: "Transparência total nas transações" },
  { icon: Star, title: "Saques rápidos", desc: "Retire para Bybit, Binance ou cartão" },
];

const FeaturesStrip = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
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
);

export default FeaturesStrip;
