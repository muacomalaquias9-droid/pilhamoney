import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(userId?: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!userId) { setIsAdmin(false); setLoading(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => { if (mounted) { setIsAdmin(!!data); setLoading(false); } });
    return () => { mounted = false; };
  }, [userId]);

  return { isAdmin, loading };
}