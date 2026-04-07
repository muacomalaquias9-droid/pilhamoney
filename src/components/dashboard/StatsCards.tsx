import { TrendingUp, Heart, Wallet } from "lucide-react";

interface StatsCardsProps {
  totalReceived: number;
  donationsCount: number;
  balance: number;
}

const StatsCards = ({ totalReceived, donationsCount, balance }: StatsCardsProps) => {
  const stats = [
    {
      label: "Total recebido",
      value: `${totalReceived.toLocaleString("pt-AO")}`,
      suffix: "AOA",
      icon: <TrendingUp size={16} />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Doações",
      value: String(donationsCount),
      suffix: "",
      icon: <Heart size={16} />,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Disponível",
      value: `${balance.toLocaleString("pt-AO")}`,
      suffix: "AOA",
      icon: <Wallet size={16} />,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border bg-card p-3 text-center">
          <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
            {stat.icon}
          </div>
          <div className="font-display text-lg font-bold text-card-foreground leading-tight">{stat.value}</div>
          {stat.suffix && <span className="text-[10px] font-medium text-muted-foreground">{stat.suffix}</span>}
          <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
