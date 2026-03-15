import logo from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Pilha-Money" className={sizes[size]} />
      {showText && (
        <span className="font-display text-xl font-bold text-foreground">
          Pilha-Money
        </span>
      )}
    </div>
  );
};

export default Logo;
