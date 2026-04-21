import { Link } from "react-router-dom";
import { useUserCount } from "@/hooks/useUserCount";

const HeroSection = () => {
  const userCount = useUserCount();

  return (
    <section className="py-10" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          Bem-vindo ao Pilha-Money 👋
        </h1>
        <p className="mb-6 text-base text-foreground">
          Aqui você recebe doações dos seus amigos por Multicaixa Express.
          Crie a sua conta e partilhe o seu link.
        </p>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <Link to="/auth?tab=register">
            <button className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
              Criar conta
            </button>
          </Link>
          <Link to="/auth">
            <button className="rounded-md border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary/5">
              Entrar
            </button>
          </Link>
        </div>

        <div className="mx-auto max-w-md rounded-md border-2 border-foreground/20 bg-card p-4 text-left">
          <p className="mb-2 text-sm font-bold underline">Como funciona:</p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
            <li>Crie a sua conta gratuita.</li>
            <li>Receba um link tipo <b>pilha-money.com/@seunome</b>.</li>
            <li>Partilhe o link nas redes sociais.</li>
            <li>Os apoiadores pagam por referência Multicaixa.</li>
            <li>O dinheiro entra na sua carteira automaticamente.</li>
          </ol>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Já temos {userCount > 0 ? userCount : 0} pessoas a usar :)
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
