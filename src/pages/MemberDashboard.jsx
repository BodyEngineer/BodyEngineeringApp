import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MemberDashboard() {
  const [member, setMember] = useState(null);

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!error) {
      setMember(data);
    } else {
      console.log(error);
    }
  }

  if (!member) {
    return <h2>Loading...</h2>;
  }

  const today = new Date();
  const expiry = new Date(member.membership_end);
  const daysRemaining = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="member-dashboard">
      <h1>Welcome {member.full_name}</h1>

      <div className="member-card">
        <h2>Membership Details</h2>

        <p>Plan: {member.membership_type}</p>
        <p>Status: {daysRemaining > 0 ? "Active" : "Expired"}</p>
        <p>Expiry: {member.membership_end}</p>
        <p>Days Remaining: {daysRemaining}</p>
      </div>
    </div>
  );
}