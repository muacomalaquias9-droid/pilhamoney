import { useState } from "react";
import { Eye, EyeOff, Copy, Wifi } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface VirtualCardProps {
  balance: number;
  username: string;
  cardNumber: string;
  showBalance: boolean;
  onToggleBalance: () => void;
}

const VirtualCard = ({ balance, username, cardNumber, showBalance, onToggleBalance }: VirtualCardProps) => {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
    toast.success("Link copiado!");
  };

  const formattedCard = cardNumber.replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="relative w-full overflow-hidden rounded-2xl p-6 text-white"
      style={{
        background: "linear-gradient(135deg, #0B6B3A 0%, #0A5C32 30%, #084D2A 60%, #063D21 100%)",
        aspectRatio: "1.7/1",
        maxHeight: "220px",
      }}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
        }}
      />

      {/* Top row: logo + contactless + eye */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Pilha-Money" className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-bold tracking-wide opacity-90">PILHA-MONEY</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi size={18} className="opacity-60 rotate-90" />
          <button onClick={onToggleBalance} className="opacity-70 hover:opacity-100 transition-opacity">
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* Chip */}
      <div className="relative mt-4 mb-3">
        <div className="h-9 w-12 rounded-md overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #F0D060 30%, #C5A028 60%, #D4AF37 100%)",
          }}
        >
          {/* Chip lines */}
          <div className="h-full w-full flex flex-col justify-center px-1 gap-[2px]">
            <div className="h-[1px] bg-black/15 w-full" />
            <div className="flex gap-[2px]">
              <div className="h-3 flex-1 border border-black/10 rounded-[1px]" />
              <div className="h-3 flex-1 border border-black/10 rounded-[1px]" />
            </div>
            <div className="h-[1px] bg-black/15 w-full" />
            <div className="flex gap-[2px]">
              <div className="h-2 flex-1 border border-black/10 rounded-[1px]" />
              <div className="h-2 flex-1 border border-black/10 rounded-[1px]" />
              <div className="h-2 flex-1 border border-black/10 rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Card number */}
      <div className="relative mb-2">
        <p className="font-mono text-[15px] tracking-[3px] opacity-90">
          {showBalance ? formattedCard : "•••• •••• •••• ••••"}
        </p>
      </div>

      {/* Bottom row: balance + username */}
      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-50 mb-0.5">Saldo disponível</p>
          <p className="font-display text-xl font-bold">
            {showBalance ? `${balance.toLocaleString("pt-AO")} Kz` : "••••••"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider opacity-50 mb-0.5">Titular</p>
          <button onClick={copyLink} className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium">@{username}</span>
            <Copy size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualCard;
