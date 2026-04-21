import { Eye, EyeOff } from "lucide-react";

interface VirtualCardProps {
  balance: number;
  username: string;
  cardNumber: string;
  showBalance: boolean;
  onToggleBalance: () => void;
}

const VirtualCard = ({ balance, username, showBalance, onToggleBalance }: VirtualCardProps) => {
  return (
    <div
      className="rounded-md border-2 border-foreground/40 bg-primary p-4 text-primary-foreground"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm">O meu saldo:</span>
        <button
          onClick={onToggleBalance}
          className="rounded border border-primary-foreground/40 px-2 py-0.5 text-xs"
        >
          {showBalance ? <Eye size={12} className="inline" /> : <EyeOff size={12} className="inline" />}
        </button>
      </div>
      <div className="mb-3 text-3xl font-bold">
        {showBalance ? balance.toLocaleString("pt-AO") : "------"} <span className="text-base">AOA</span>
      </div>
      <div className="border-t border-primary-foreground/30 pt-2 text-xs">
        Conta de: @{username}
      </div>
    </div>
  );
};

export default VirtualCard;
