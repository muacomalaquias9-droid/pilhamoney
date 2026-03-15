import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth?tab=register">
            <Button size="sm">Criar Conta</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Entrar</Button>
            </Link>
            <Link to="/auth?tab=register" onClick={() => setOpen(false)}>
              <Button className="w-full">Criar Conta</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
