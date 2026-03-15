import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserCount() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_user_count");
      if (typeof data === "number") setCount(data);
    };
    fetch();

    // Listen for new profiles in realtime
    const channel = supabase
      .channel("profiles_count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
