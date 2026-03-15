import logo from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const textSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="Pilha-Money" className={sizes[size]} />
      {showText && (
        <span className={`font-display font-bold text-foreground ${textSizes[size]}`}>
          Pilha-Money
        </span>
      )}
    </div>
  );
};

export default Logo;
