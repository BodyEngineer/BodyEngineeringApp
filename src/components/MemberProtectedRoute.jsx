import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

export default function MemberProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkMember();
  }, []);

  async function checkMember() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    // Check normal gym member
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (member) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    // Check online client
    const { data: onlineClient } = await supabase
      .from("online_clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (onlineClient) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    setAllowed(false);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/member-login" replace />;
  }

  return children;
}