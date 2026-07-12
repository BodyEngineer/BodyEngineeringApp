import { useEffect, useState } from "react";
import { getOnlineClients } from "../services/onlineClientServices";

export function useOnlineClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await getOnlineClients();
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    clients,
    loading,
    refresh: loadClients,
  };
}