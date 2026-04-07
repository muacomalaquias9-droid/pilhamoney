import { Heart, Clock } from "lucide-react";

interface Donation {
  id: string;
  donor_name: string | null;
  amount: number;
  message: string | null;
  created_at: string;
  currency: string;
  status: string;
}

const DonationsList = ({ donations }: { donations: Donation[] }) => {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Heart size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhuma doação ainda</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Compartilhe seu link para receber doações</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString("pt-AO", { day: "2-digit", month: "short" });
  };

  return (
    <div className="divide-y divide-border">
      {donations.map((d) => (
        <div key={d.id} className="flex items-center gap-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
            <Heart size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-card-foreground truncate">{d.donor_name || "Anônimo"}</span>
              <span className="text-sm font-bold text-primary whitespace-nowrap">
                +{d.amount.toLocaleString("pt-AO")} <span className="text-[10px] font-normal text-muted-foreground">AOA</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {d.message && <span className="text-xs text-muted-foreground truncate flex-1">"{d.message}"</span>}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                <Clock size={10} />
                {formatDate(d.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DonationsList;
