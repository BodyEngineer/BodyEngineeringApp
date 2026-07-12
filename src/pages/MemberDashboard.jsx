import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";


export default function MemberDashboard() {
  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadMember();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/member-login")
  }
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
const { data: latestAssessment, error } = await supabase
  .from("body_assessments")
  .select("*")
  .eq("member_id", data.id)
  .order("assessment_date", { ascending: false })
  .limit(1)
  .single();

if (error) {
  console.log(error);
} else {
  setAssessment(latestAssessment);
}
 
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
{/* PREMIUM HERO */}

<div className="premium-hero">

  <div className="hero-left">

    <div className="avatar-ring">
      <img
        src={member.profile_photo || "https://i.pravatar.cc/200"}
        className="member-avatar"
        alt="profile"
      />
    </div>

    <div>

      <p className="hero-brand">
        BODY ENGINEERING 
        Female Fitness Studio
      </p>

      <h1>
        Welcome,
        <span className="hero-name">
          {" "}{member.full_name}
        </span>
      </h1>

      <p className="hero-message">
        💪 Every workout makes you stronger.
      </p>
       
      <p className="hero-quote">
        "The Body Achieves What Mind Believes".
      </p>

      <div className="hero-stats">

        <div className="hero-pill">
          🏆 {member.membership_type}
        </div>

        <div className="hero-pill">
          ❤️ {assessment?.goal || "Fitness Goal"}
        </div>

        <div className="hero-pill">
          ⚖️ {assessment?.weight || "--"} kg
        </div>

      </div>

    </div>

  </div>

  <div className="hero-right">

    <div className="status-pill">
      {daysRemaining > 0 ? "🟢 ACTIVE" : "🔴 EXPIRED"}
    </div>

    <div className="days-box">

      <h1>{daysRemaining}</h1>

      <p>Days Remaining</p>

    </div>

    <button
      className="logout-btn"
      onClick={handleLogout}
    >
      Sign Out
    </button>

  </div>

</div>
      {/* MEMBERSHIP */}

      <div className="assessment-card">

  <h2>📊 Fitness Overview</h2>

  <div className="quick-grid">

  <div className="quick-card">

<div className="quick-icon">👤</div>

<h3>My Profile</h3>

<p>
  Update your personal information
</p>

<button
  className="view-btn"
  onClick={() => navigate("/member-dashboard/profile")}
>
  Open Profile →
</button>

</div>

    <div className="quick-card">
      <div className="quick-icon">⚖️</div>
      <h3>Weight</h3>
      <h1>{assessment?.weight || "--"} kg</h1>
    </div>

    <div className="quick-card">
      <div className="quick-icon">❤️</div>
      <h3>BMI</h3>
      <h1>{assessment?.bmi || "--"}</h1>
    </div>

    <div className="quick-card">
      <div className="quick-icon">💧</div>
      <h3>Body Fat</h3>
      <h1>{assessment?.body_fat || "--"}%</h1>
    </div>

    <div className="quick-card">
      <div className="quick-icon">🏋️</div>
      <h3>Total Visits</h3>
      <h1>{attendance.length}</h1>
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

  <div className="quick-icon">❤️</div>

  <h3>My Transformation</h3>

  <p>
    View Measurements,
    Progress & Coach Notes
  </p>

  <button
    className="view-btn"
    onClick={() => navigate("/member-dashboard/my-transformation")}
  >
    View Full Report →
  </button>

</div>

</div>
    </div>
  );
}