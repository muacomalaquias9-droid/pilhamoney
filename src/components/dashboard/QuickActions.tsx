import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Send, Clock } from "lucide-react";
import PersonalQRCode from "./PersonalQRCode";

interface QuickActionsProps {
  username: string;
  fullName: string;
  userId: string;
  onWithdraw: () => void;
  onTransfer: () => void;
}

const QuickActions = ({ username, fullName, userId, onWithdraw, onTransfer }: QuickActionsProps) => {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
    toast.success("Link de doação copiado!");
  };

  const actions = [
    { icon: <ArrowDownLeft size={20} />, label: "Receber", color: "bg-primary/10 text-primary", onClick: copyLink },
    { icon: <Send size={20} />, label: "Transferir", color: "bg-accent/10 text-accent", onClick: onTransfer },
    { icon: <ArrowUpRight size={20} />, label: "Sacar", color: "bg-warning/10 text-warning", onClick: onWithdraw },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon, label, color, onClick }) => (
        <button key={label} onClick={onClick} className="flex flex-col items-center py-2 rounded-2xl hover:bg-muted/50 transition-colors">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} transition-transform active:scale-95`}>
            {icon}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground mt-1.5">{label}</span>
        </button>
      ))}
      <PersonalQRCode username={username} fullName={fullName} userId={userId} />
    </div>
  );
};

export default QuickActions;
