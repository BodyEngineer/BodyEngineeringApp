import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MemberDashboard() {
  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(false);

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

    if (error) {
      console.log(error);
    } else {
      setMember(data);
      const { data: attendanceData } = await supabase
  .from("attendance")
  .select("*")
  .eq("member_id", data.id)
  .order("check_in", { ascending: false });

setAttendance(attendanceData || []);
const today = new Date().toDateString();

const checkedInToday =
  attendanceData?.some(
    (a) => new Date(a.check_in).toDateString() === today
  ) || false;

setCheckedInToday(checkedInToday);
    }
  }

  if (!member) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  const today = new Date();
  const expiry = new Date(member.membership_end);
  const daysRemaining = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  const totalVisits = attendance.length;
  const lastVisit =
  attendance.length > 0
    ? new Date(attendance[0].check_in).toLocaleDateString()
    : "No Visits";

  return (
    <div className="page">
{/* HERO */}

<div className="member-hero">

  <div className="member-left">

    <img
      src="https://i.pravatar.cc/160"
      alt="profile"
      className="member-avatar"
    />

    <div>

      <p className="member-hero-subtitle">
        BODY ENGINEERING
      </p>

      <h1>
        Welcome,
        <span className="hero-name">
          {" "}{member.full_name}
        </span>
      </h1>

      <p className="member-message">
        💪 Every workout makes you stronger.
        Keep pushing your limits.
      </p>

    </div>

  </div>

  <div className="hero-right">

    <div
      className={
        daysRemaining > 0
          ? "badge badge-active"
          : "badge badge-expired"
      }
    >
      {daysRemaining > 0 ? "ACTIVE" : "EXPIRED"}
    </div>

  </div>

</div>

      {/* MEMBERSHIP */}

      <div className="member-card">

        <h2>Membership Details</h2>

        <div className="membership-grid">

          <div className="membership-box">
            <div className="membership-icon">📋</div>
            <p className="membership-label">Membership</p>
            <h3>{member.membership_type}</h3>
          </div>

          <div className="membership-box">
            <div className="membership-icon">📅</div>
            <p className="membership-label">Expiry Date</p>
            <h3>{member.membership_end}</h3>
          </div>

          <div className="membership-box">
            <div className="membership-icon">⏳</div>
            <p className="membership-label">Days Remaining</p>
            <h3>{daysRemaining} Days</h3>
          </div>

        </div>

      </div>

  {/* QUICK ACCESS */}

<div className="quick-grid">

<div className="quick-card">

  <div className="quick-icon">📅</div>

  <h3>Attendance</h3>

  <h1>{totalVisits}</h1>

  <p>Total Visits</p>

  <span
    className={
      checkedInToday
        ? "status-present"
        : "status-absent"
    }
  >
    {checkedInToday ? "✅ Present Today" : "❌ Not Checked In"}
  </span>

  <small className="last-visit">
    Last Visit: {lastVisit}
  </small>

</div>

<div className="quick-card">
  <div className="quick-icon">🏋️</div>
  <h3>Workout Plan</h3>
  <p>Coming Soon</p>
</div>

<div className="quick-card">
  <div className="quick-icon">🥗</div>
  <h3>Diet Plan</h3>
  <p>Coming Soon</p>
</div>

<div className="quick-card">
  <div className="quick-icon">📈</div>
  <h3>Progress</h3>
  <p>Coming Soon</p>
</div>

</div>
    </div>
  );
}