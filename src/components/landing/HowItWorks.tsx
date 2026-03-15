import { motion } from "framer-motion";
import { Users, Globe, Heart } from "lucide-react";

const steps = [
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
];

const HowItWorks = () => (
  <section className="border-t border-border bg-secondary/20 py-20">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-14 max-w-lg text-center">
        <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Como funciona</h2>
        <p className="text-muted-foreground">Em 3 passos simples, comece a receber doações de apoiadores</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative rounded-2xl border border-border bg-card p-8"
          >
            <span className="mb-4 block font-display text-4xl font-bold text-primary/20">{item.step}</span>
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
);

export default HowItWorks;
