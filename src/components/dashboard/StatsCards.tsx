import DashboardGlyph from "@/components/dashboard/DashboardGlyph";

interface StatsCardsProps {
  totalReceived: number;
  donationsCount: number;
  balance: number;
}

const StatsCards = ({ totalReceived, donationsCount, balance }: StatsCardsProps) => {
  const stats = [
    {
      icon: "incoming",
      label: "Total Recebido",
      value: `${totalReceived.toLocaleString("pt-AO")} Kz`,
      color: "text-primary bg-primary/10",
    },
    {
      icon: "growth",
      label: "Doações",
      value: String(donationsCount),
      color: "text-warning bg-warning/10",
    },
    {
      icon: "wallet",
      label: "Disponível",
      value: `${balance.toLocaleString("pt-AO")} Kz`,
      color: "text-accent bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon, label, value, color }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center text-center shadow-sm">
          <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 ${color}`}>
            <DashboardGlyph name={icon as "incoming" | "growth" | "wallet"} className="h-[17px] w-[17px]" />
          </div>
          <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-bold text-card-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
