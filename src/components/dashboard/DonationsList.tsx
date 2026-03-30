import DashboardGlyph from "@/components/dashboard/DashboardGlyph";

interface DonationsListProps {
  donations: any[];
}

const DonationsList = ({ donations }: DonationsListProps) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (donations.length === 0) {
    return (
      <div className="py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/50">
            <DashboardGlyph name="wallet" className="h-6 w-6" />
          </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhuma doação ainda</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Compartilhe seu link para começar a receber</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {donations.map((d) => (
        <div key={d.id} className="flex items-center justify-between py-3 px-1 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-primary/10 text-primary">
              <DashboardGlyph name="incoming" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{d.donor_name || "Anônimo"}</p>
              <p className="text-[11px] text-muted-foreground">
                {d.message ? d.message.substring(0, 30) + (d.message.length > 30 ? "..." : "") : formatDate(d.created_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">+{d.amount.toLocaleString("pt-AO")} Kz</p>
            <p className="text-[10px] text-muted-foreground">{formatDate(d.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DonationsList;
