import { ArrowDownLeft, Wallet } from "lucide-react";

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
        <Wallet className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ArrowDownLeft size={14} className="text-primary" />
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
