import { Link } from "react-router-dom";
import { toast } from "sonner";
import DashboardGlyph from "@/components/dashboard/DashboardGlyph";

interface QuickActionsProps {
  username: string;
  onWithdraw: () => void;
}

const QuickActions = ({ username, onWithdraw }: QuickActionsProps) => {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
    toast.success("Link de doação copiado!");
  };

  const actions = [
    { icon: "receive", label: "Receber", color: "bg-primary/10 text-primary", onClick: copyLink },
    { icon: "withdraw", label: "Sacar", color: "bg-warning/10 text-warning", onClick: onWithdraw },
    { icon: "profile", label: "Perfil", color: "bg-accent/10 text-accent", to: `/@${username}` },
    { icon: "history", label: "Histórico", color: "bg-secondary text-foreground", onClick: () => {} },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ icon, label, color, onClick, to }) => {
        const content = (
          <>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 shadow-sm ${color}`}>
              <DashboardGlyph name={icon as "receive" | "withdraw" | "profile" | "history"} className="h-[18px] w-[18px]" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground mt-1.5">{label}</span>
          </>
        );

        if (to) {
          return (
            <Link key={label} to={to} className="flex flex-col items-center py-2 rounded-2xl hover:bg-muted/50 transition-colors">
              {content}
            </Link>
          );
        }

        return (
          <button key={label} onClick={onClick} className="flex flex-col items-center py-2 rounded-2xl hover:bg-muted/50 transition-colors">
            {content}
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
