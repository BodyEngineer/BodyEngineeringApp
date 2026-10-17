import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useOnlineClient(id) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
        const { data, error } = await supabase
        .from("online_clients")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) {
        setClient(data);
      }

      setLoading(false);
    }

    loadClient();
  }, [id]);

  return { client, loading };
}