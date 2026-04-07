import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Send, Clock } from "lucide-react";

interface QuickActionsProps {
  username: string;
  onWithdraw: () => void;
  onTransfer: () => void;
}

const QuickActions = ({ username, onWithdraw, onTransfer }: QuickActionsProps) => {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
    toast.success("Link de doação copiado!");
  };

  const actions = [
    {
      icon: <ArrowDownLeft size={20} />,
      label: "Receber",
      color: "bg-primary/10 text-primary",
      onClick: copyLink,
    },
    {
      icon: <Send size={20} />,
      label: "Transferir",
      color: "bg-accent/10 text-accent",
      onClick: onTransfer,
    },
    {
      icon: <ArrowUpRight size={20} />,
      label: "Sacar",
      color: "bg-warning/10 text-warning",
      onClick: onWithdraw,
    },
    {
      icon: <Clock size={20} />,
      label: "Histórico",
      color: "bg-secondary text-foreground",
      to: "#history",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon, label, color, onClick, to }) => {
        const content = (
          <>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} transition-transform active:scale-95`}>
              {icon}
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
