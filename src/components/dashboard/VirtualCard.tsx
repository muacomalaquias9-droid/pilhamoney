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
    <div className="balance-card-bg rounded-3xl p-6 text-white relative z-10">
      <div className="relative z-10 flex flex-col h-full min-h-[160px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-white/60 tracking-wide uppercase">Saldo disponível</span>
          <button
            onClick={onToggleBalance}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>

        <div className="mt-1 mb-auto">
          <div className="font-display text-4xl font-bold tracking-tight">
            {showBalance ? `${balance.toLocaleString("pt-AO")}` : "••••••"}
            <span className="text-lg ml-1 font-semibold text-white/70">AOA</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Titular</div>
            <div className="text-sm font-semibold text-white/90">@{username}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-base font-bold text-white/90 tracking-wide">PILHA</div>
            <div className="text-[10px] text-white/50 -mt-0.5">MONEY</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualCard;
