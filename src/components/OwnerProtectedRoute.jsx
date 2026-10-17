import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "./LoadingSpinner";

export default function OwnerProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [checkingRole, setCheckingRole] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnerRole = async () => {
      if (!user) {
        setIsOwner(false);
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Owner role check error:", error);
        setIsOwner(false);
      } else {
        setIsOwner(data?.role === "owner");
      }

      setCheckingRole(false);
    };

    if (!authLoading) {
      checkOwnerRole();
    }
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
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!isOwner) {
    return <Navigate to="/member-login" replace />;
  }

  return children;
}