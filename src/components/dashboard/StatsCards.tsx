import { ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";

interface StatsCardsProps {
  totalReceived: number;
  donationsCount: number;
  balance: number;
}

const StatsCards = ({ totalReceived, donationsCount, balance }: StatsCardsProps) => {
  const stats = [
    {
      icon: ArrowDownLeft,
      label: "Total Recebido",
      value: `${totalReceived.toLocaleString("pt-AO")} Kz`,
      color: "text-primary bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Doações",
      value: String(donationsCount),
      color: "text-amber-600 bg-amber-500/10",
    },
    {
      icon: Wallet,
      label: "Disponível",
      value: `${balance.toLocaleString("pt-AO")} Kz`,
      color: "text-blue-600 bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-3 flex flex-col items-center text-center">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-2`}>
            <Icon size={16} />
          </div>
          <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-bold text-card-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
