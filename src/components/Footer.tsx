import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <Logo size="sm" />
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Criado pelo <span className="font-semibold text-foreground">Isaac Muaco</span>
          </p>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pilha-Money. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
