import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

export default function MemberProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [checkingRole, setCheckingRole] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkMember() {
      if (authLoading) return;

      if (!user) {
        setAllowed(false);
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);

      try {
        // Check normal gym member
        const { data: member, error: memberError } = await supabase
          .from("members")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (memberError) throw memberError;

        if (member) {
          if (active) setAllowed(true);
          return;
        }

        // Check online client
        const { data: onlineClient, error: clientError } = await supabase
          .from("online_clients")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (clientError) throw clientError;

        if (active) {
          setAllowed(Boolean(onlineClient));
        }
      } catch (error) {
        console.error("Member access check error:", error);

        if (active) setAllowed(false);
      } finally {
        if (active) setCheckingRole(false);
      }
    }

    checkMember();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  if (authLoading || checkingRole) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/member-login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!allowed) {
    return <Navigate to="/member-login" replace />;
  }

  return children;
}