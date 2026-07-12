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
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("members")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    setAllowed(!!data);

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