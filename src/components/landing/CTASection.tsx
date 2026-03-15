import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const CTASection = () => (
  <section className="pb-20">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-14"
      >
        <img src={logo} alt="Pilha-Money" className="mx-auto mb-6 h-16 w-16" />
        <h2 className="mb-3 font-display text-3xl font-bold">Comece a receber doações hoje</h2>
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
);

export default CTASection;
