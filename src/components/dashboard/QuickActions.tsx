import { Send, ArrowUpRight, User, History } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
    { icon: Send, label: "Receber", color: "bg-primary/10 text-primary", onClick: copyLink },
    { icon: ArrowUpRight, label: "Sacar", color: "bg-amber-500/10 text-amber-600", onClick: onWithdraw },
    { icon: User, label: "Perfil", color: "bg-blue-500/10 text-blue-600", to: `/@${username}` },
    { icon: History, label: "Histórico", color: "bg-purple-500/10 text-purple-600", onClick: () => {} },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ icon: Icon, label, color, onClick, to }) => {
        const content = (
          <>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground mt-1.5">{label}</span>
          </>
        );

        if (to) {
          return (
            <Link key={label} to={to} className="flex flex-col items-center py-2 rounded-xl hover:bg-muted/50 transition-colors">
              {content}
            </Link>
          );
        }

        return (
          <button key={label} onClick={onClick} className="flex flex-col items-center py-2 rounded-xl hover:bg-muted/50 transition-colors">
            {content}
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
