import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "donation" | "transfer_in" | "transfer_out" | "withdrawal";
  message: string;
  amount: number;
  time: string;
  read: boolean;
}

const notifSound = typeof Audio !== "undefined" ? new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1qgIeNkJOVlZKOiYJ7dG9vcXR5foOIi42OjYyKiIV/enVxb3F1eoGGi46QkpGPi4eBeHFtbXB1e4KIjZCSkZCOi4eDfXdycHJ2e4KHjI+RkY+NioaDfXhzcnR4fYOIjI+QkI+MiYWBfHd0c3V5foSJjI+QkI6MiIWBfHhzc3V5foSIjI6PkI6LiYWBfXh0c3V5foOIjI6Pj46LiYWBfXh0dHZ6foSIjI6Pj46MiIWBfXh0dHZ6foOIi46Pj46LiIWBfnh1dHZ6fYOHi42Oj46LiYaBfnh1dXd7fYOHi42Oj42LiIaBfnh1dXd7fYOHi42OjY2KiIWBf3l2dnh7fYKHi42NjY2KiIWBf3l2dnh7fYKGio2NjYyKiIWBf3p3d3l8fYKGio2NjYyKh4WBf3p3d3l8fYKGio2NjYyKh4WAf3p3d3l8fYKGioyNjYyKh4WAf3p4eHl8foKGioyMjIuKh4WAf3p4eHp8foKGioyMjIuJh4SAf3t4eHp8foKGioyMjIuJh4SAgHt5eXp9foKFiYuMjIuJh4SAgHt5eXt9foKFiYuMi4uJhoSAgHt5eXt9foKFiYuLi4uJhoSAgHx6ent9foGFiYuLi4qIhoOAgHx6ent+foGFiIqLi4qIhoOA") : null;

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll for new donations & transfers
  useEffect(() => {
    if (!userId) return;

    const fetchNew = async () => {
      const since = lastCheckRef.current;

      const [donRes, trInRes, trOutRes] = await Promise.all([
        supabase.from("donations").select("id, amount, donor_name, created_at")
          .eq("recipient_id", userId).eq("status", "completed")
          .gt("created_at", since).order("created_at", { ascending: false }).limit(10),
        supabase.from("transfers").select("id, amount, note, created_at, sender:profiles!transfers_sender_id_fkey(username)")
          .eq("receiver_id", userId).gt("created_at", since).order("created_at", { ascending: false }).limit(10),
        supabase.from("transfers").select("id, amount, note, created_at, receiver:profiles!transfers_receiver_id_fkey(username)")
          .eq("sender_id", userId).gt("created_at", since).order("created_at", { ascending: false }).limit(10),
      ]);

      const newNotifs: Notification[] = [];

      (donRes.data || []).forEach((d: any) => {
        newNotifs.push({
          id: `don-${d.id}`,
          type: "donation",
          message: `${d.donor_name || "Anônimo"} doou ${Number(d.amount).toLocaleString("pt-AO")} AOA`,
          amount: d.amount,
          time: d.created_at,
          read: false,
        });
      });

      (trInRes.data || []).forEach((t: any) => {
        newNotifs.push({
          id: `tri-${t.id}`,
          type: "transfer_in",
          message: `@${t.sender?.username || "?"} transferiu ${Number(t.amount).toLocaleString("pt-AO")} AOA`,
          amount: t.amount,
          time: t.created_at,
          read: false,
        });
      });

      (trOutRes.data || []).forEach((t: any) => {
        newNotifs.push({
          id: `tro-${t.id}`,
          type: "transfer_out",
          message: `Transferiu ${Number(t.amount).toLocaleString("pt-AO")} AOA para @${t.receiver?.username || "?"}`,
          amount: t.amount,
          time: t.created_at,
          read: false,
        });
      });

      if (newNotifs.length > 0) {
        // Play sound
        if (notifSound) {
          notifSound.play().catch(() => {});
        }
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n.id));
          const fresh = newNotifs.filter((n) => !ids.has(n.id));
          return [...fresh, ...prev].slice(0, 50);
        });
        setUnreadCount((c) => c + newNotifs.length);
      }

      lastCheckRef.current = new Date().toISOString();
    };

    // Initial load - get recent items
    const loadRecent = async () => {
      const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [donRes, trInRes] = await Promise.all([
        supabase.from("donations").select("id, amount, donor_name, created_at")
          .eq("recipient_id", userId).eq("status", "completed")
          .gt("created_at", recent).order("created_at", { ascending: false }).limit(10),
        supabase.from("transfers").select("id, amount, note, created_at, sender:profiles!transfers_sender_id_fkey(username)")
          .eq("receiver_id", userId).gt("created_at", recent).order("created_at", { ascending: false }).limit(10),
      ]);

      const notifs: Notification[] = [];
      (donRes.data || []).forEach((d: any) => {
        notifs.push({
          id: `don-${d.id}`,
          type: "donation",
          message: `${d.donor_name || "Anônimo"} doou ${Number(d.amount).toLocaleString("pt-AO")} AOA`,
          amount: d.amount,
          time: d.created_at,
          read: true,
        });
      });
      (trInRes.data || []).forEach((t: any) => {
        notifs.push({
          id: `tri-${t.id}`,
          type: "transfer_in",
          message: `@${t.sender?.username || "?"} transferiu ${Number(t.amount).toLocaleString("pt-AO")} AOA`,
          amount: t.amount,
          time: t.created_at,
          read: true,
        });
      });

      setNotifications(notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      lastCheckRef.current = new Date().toISOString();
    };

    loadRecent();
    const interval = setInterval(fetchNew, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell size={17} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold text-card-foreground">Notificações</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      n.type === "donation" ? "bg-green-100 text-green-600" :
                      n.type === "transfer_in" ? "bg-blue-100 text-blue-600" :
                      "bg-orange-100 text-orange-600"
                    }`}>
                      {n.type === "donation" ? "💰" : n.type === "transfer_in" ? "📥" : "📤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-card-foreground leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.time)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
