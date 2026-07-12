import { useEffect, useState } from "react";
import { getCurrentMember } from "../services/memberService";

export function useMember() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
    try {
      const data = await getCurrentMember();
      setMember(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    member,
    setMember,
    loading,
    refresh: loadMember,
  };
}