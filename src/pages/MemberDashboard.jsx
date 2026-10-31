import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";


export default function MemberDashboard() {
  const [member, setMember] = useState(null);
  const [memberType, setMemberType] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentSubmitting, setPaymentSubmitting] = useState(false);
const [paymentMessage, setPaymentMessage] = useState("");
const [paymentRequest, setPaymentRequest] = useState(null);
const [renewalPeriod, setRenewalPeriod] = useState("monthly");

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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("User error:", userError);
      return;
    }

    if (!user) {
      navigate("/member-login");
      return;
    }



    // =========================
    // FIND GYM MEMBER
    // =========================

    async function loadGymMember(userId) {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.log("Gym member error:", error);
        return null;
      }

      if (data) {
        setMemberType("gym");
      }
      return data;
    }

    // =========================
    // FIND ONLINE CLIENT
    // =========================

    async function loadOnlineClient(userId) {
      const { data, error } = await supabase
        .from("online_clients")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.log("Online client error:", error);
        return null;
      }

      if (data) {
        setMemberType("online");
      }

      return data;
    }

    // First check gym members
    let memberData = await loadGymMember(user.id);

    // If not gym member, check online clients
    if (!memberData) {
      memberData = await loadOnlineClient(user.id);
    }

    if (!memberData) {
      console.log("No member found for logged-in user.");
      return;
    }

    setMember(memberData);

// LOAD WEBSITE SETTINGS + QR
// Works for Gym + Online
// =========================

const { data: settingsData } = await supabase
.from("website_settings")
.select("*")
.eq("id", 1)
.single();

if (settingsData) {
setWebsiteSettings(settingsData);
}

const {
data: qrData,
error: qrError,
} = await supabase.storage
.from("payment-media")
.createSignedUrl("gpay-qr.jpeg", 3600);

if (qrError) {
console.error("QR image error:", qrError);
} else {
setQrImageUrl(qrData?.signedUrl || "");
}

    // =========================
    // ATTENDANCE
    // Only relevant for gym members
    // =========================

    if (memberData && memberData.membership_end) {
      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select("*")
        .eq("member_id", memberData.id)
        .order("check_in", { ascending: false });

      if (attendanceError) {
        console.log("Attendance error:", attendanceError);
      } else {
        setAttendance(attendanceData || []);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaySessions = (attendanceData || []).filter((item) => {
          const checkIn = new Date(item.check_in);
        
          return checkIn >= today && checkIn < tomorrow;
        });
        
        const latestTodaySession = todaySessions[0] || null;
        
        const openSession = todaySessions.find(
          (item) => !item.check_out
        );
        
        setCheckedInToday(Boolean(latestTodaySession));
        
        setCheckedOutToday(
          Boolean(latestTodaySession && !openSession)
        );
      }
    }

    // =========================
    // LATEST BODY ASSESSMENT
    // =========================

    const {
      data: latestAssessment,
      error: assessmentError,
    } = await supabase
      .from("body_assessments")
      .select("*")
      .eq("member_id", memberData.id)
      .order("assessment_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError) {
      console.log("Assessment error:", assessmentError);
    } else {
      setAssessment(latestAssessment);
    }
  }

   // =========================
// SUBMIT PAYMENT REQUEST
// =========================

const handlePaymentSubmit = async () => {
  if (!paymentFile) {
    setPaymentMessage("Please select your payment screenshot.");
    return;
  }

  if (!paymentAmount || Number(paymentAmount) <= 0) {
    setPaymentMessage("Please enter a valid payment amount.");
    return;
  }

  if (!member?.id) {
    setPaymentMessage("Member information not available.");
    return;
  }

  try {
    setPaymentSubmitting(true);
    setPaymentMessage("");

    // -------------------------
    // GET CURRENT USER
    // -------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Please login again.");
    }

    // -------------------------
    // CREATE UNIQUE FILE PATH
    // -------------------------

    const fileExtension =
      paymentFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${member.id}/${Date.now()}.${fileExtension}`;

    // UPLOAD PAYMENT SCREENSHOT TO SUPABASE STORAGE
    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("payment-media")
        .upload(filePath, paymentFile, {
          contentType: paymentFile.type,
          upsert: false,
        });

    if (uploadError) {
      console.error("Payment screenshot upload error:", uploadError);
      throw new Error(
        `Screenshot upload failed: ${uploadError.message}`
      );
    }



    // -------------------------
    // CREATE PAYMENT REQUEST
    // -------------------------

    const paymentData = {
      amount: Number(paymentAmount),
      screenshot_url: filePath,
      status: "pending",
      payment_date: new Date().toISOString().split("T")[0],
      renewal_period: renewalPeriod,
    };

    if (memberType === "online") {
      paymentData.online_client_id = member.id;
    } else {
      paymentData.member_id = member.id;
    }

    const { data: requestData, error: requestError } =
      await supabase
        .from("payment_requests")
        .insert(paymentData)
        .select()
        .single();

    if (requestError) {
      console.error("Payment request error:", requestError);

      // Cleanup uploaded screenshot
      await supabase.storage
        .from("payment-media")
        .remove([filePath]);

      throw new Error("Unable to create payment request.");
    }

    setPaymentRequest(requestData);
    setPaymentFile(null);
    setPaymentAmount("");

    setPaymentMessage(
      "✅ Payment submitted successfully. Waiting for approval."
    );

  } catch (error) {
    console.error("Payment submission error:", error);

    setPaymentMessage(
      error.message || "Something went wrong. Please try again."
    );

  } finally {
    setPaymentSubmitting(false);
  }
};

  if (!member) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  const membershipExpiry =
  memberType === "online"
    ? member.expiry_date
    : member.membership_end;

const today = new Date();
today.setHours(0, 0, 0, 0);

const expiry = membershipExpiry
  ? new Date(`${membershipExpiry}T00:00:00`)
  : null;

const daysRemaining = expiry
  ? Math.round((expiry - today) / (1000 * 60 * 60 * 24))
  : 0;

const isExpired = !expiry || daysRemaining < 0;

const displayDays = Math.abs(daysRemaining);

const showRenewalCard = true;

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

  <div
  className={`status-pill ${
    isExpired ? "status-expired" : "status-active"
  }`}
>
  {isExpired ? "🔴 MEMBERSHIP EXPIRED" : "🟢 ACTIVE"}
</div>

    <div className="days-box">

    <h1>
  {expiry ? displayDays : "—"}
</h1>

<p>
  {!expiry
    ? "Renewal Required"
    : isExpired
    ? "Days Expired"
    : "Days Remaining"}
</p>

    </div>

    <button
      className="logout-btn"
      onClick={handleLogout}
    >
      Sign Out
    </button>

  </div>

</div>

{/* ATTENDANCE CTA */}

<div className="attendance-cta">

  <div className="attendance-cta-left">

    <div className="attendance-qr-icon">
      📱
    </div>

    <div>
      <span className="attendance-label">
        DAILY ATTENDANCE
      </span>

      <h2>
      {!checkedInToday
  ? "Mark Today's Attendance"
  : checkedOutToday
  ? "You've completed today's workout! 🎉"
  : "You're checked in today! 🎉"}
      </h2>

      <p>
  {!checkedInToday
    ? "Scan the gym QR code to record your workout visit."
    : checkedOutToday
    ? "Great work today! Your check-out has been recorded."
    : "Your check-in is recorded. Scan the QR code again when leaving the gym."}
</p>
    </div>

  </div>

  <button
  className="attendance-btn"
  onClick={() => {
    if (checkedInToday && checkedOutToday) {
      setShowAttendanceHistory(true);
  
      setTimeout(() => {
        const historyPanel = document.getElementById("attendance-history");
  
        historyPanel?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    } else {
      navigate("/member-attendance");
    }
  }}
>
  {!checkedInToday
    ? "📷 Scan QR to Check In →"
    : checkedOutToday
    ? "View Attendance →"
    : "📷 Scan QR to Check Out →"}
</button>

</div>

{showRenewalCard && websiteSettings && (
  <div className={`renewal-card ${isExpired ? "renewal-expired" : "renewal-active"}`}>
  
  <h2 className="renewal-card-title">
  {isExpired
    ? "🚨 Your Membership Has Expired"
    : "⚠️ Keep Your Fitness Journey Going!"}
</h2>

    <p>
      {isExpired
        ? `Your membership expired ${Math.abs(
            daysRemaining
          )} days ago.`
        : `Your membership expires in ${daysRemaining} days.`}
    </p>

    <div className="renewal-layout">
      {/* PAYMENT DETAILS */}

      <div className="renewal-details">
        <p>
          <strong>Plan:</strong>{" "}
          {member.membership_type}
        </p>

        <p>
  <strong>Expiry Date:</strong>{" "}
  {membershipExpiry
    ? new Date(membershipExpiry).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No expiry date"}
</p>

        <div style={{ marginTop: "18px" }}>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
    }}
  >
    🔄 Renewal Period
  </label>

  <select
    value={renewalPeriod}
    onChange={(e) => setRenewalPeriod(e.target.value)}
    disabled={
      paymentSubmitting ||
      paymentRequest?.status === "pending"
    }
    style={{
      width: "100%",
      maxWidth: "300px",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #444",
      background: "#1b1b1b",
      color: "#fff",
      fontSize: "15px",
    }}
  >
    <option value="monthly">
      Monthly — 1 Month
    </option>

    <option value="quarterly">
      Quarterly — 3 Months
    </option>

    <option value="half-yearly">
      Half-Yearly — 6 Months
    </option>

    <option value="yearly">
      Yearly — 12 Months
    </option>
  </select>
</div>

        <p>
          <strong>UPI ID:</strong>{" "}
          {websiteSettings.upi_id || "Not available"}
        </p>

        {/* AMOUNT */}

        <div style={{ marginTop: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Payment Amount
          </label>

          <input
            type="number"
            min="1"
            value={paymentAmount}
            onChange={(e) =>
              setPaymentAmount(e.target.value)
            }
            placeholder="Enter amount paid"
            disabled={paymentSubmitting}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#1b1b1b",
              color: "#fff",
            }}
          />
        </div>

        {/* SCREENSHOT */}

        <div style={{ marginTop: "18px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Payment Screenshot
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setPaymentFile(e.target.files?.[0] || null)
            }
            disabled={paymentSubmitting}
          />

          {paymentFile && (
            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                opacity: 0.8,
              }}
            >
              📎 {paymentFile.name}
            </p>
          )}
        </div>

        {/* SUBMIT */}

        <button
          type="button"
          onClick={handlePaymentSubmit}
          disabled={
            paymentSubmitting ||
            paymentRequest?.status === "pending"
          }
          style={{
            marginTop: "18px",
            padding: "12px 22px",
            borderRadius: "10px",
            border: "none",
            background:
              paymentRequest?.status === "pending"
                ? "#555"
                : "#ff4438",
            color: "#fff",
            fontWeight: "700",
            cursor:
              paymentSubmitting ||
              paymentRequest?.status === "pending"
                ? "not-allowed"
                : "pointer",
          }}
        >
          {paymentSubmitting
            ? "Uploading..."
            : paymentRequest?.status === "pending"
            ? "⏳ Verification Pending"
            : isExpired
  ? "🔴 Renew Membership Now"
  : "💳 Renew Membership"}
        </button>

        {/* MESSAGE */}

        {paymentMessage && (
          <p
            style={{
              marginTop: "12px",
              fontWeight: "600",
            }}
          >
            {paymentMessage}
          </p>
        )}

        {/* EXISTING REQUEST STATUS */}

        {paymentRequest && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "#1b1b1b",
            }}
          >
            <strong>Payment Request:</strong>

            <p style={{ margin: "6px 0 0" }}>
              Amount: ₹{paymentRequest.amount}
            </p>

            <p style={{ margin: "6px 0 0" }}>
  Renewal:{" "}
  {paymentRequest.renewal_period === "monthly"
    ? "Monthly — 1 Month"
    : paymentRequest.renewal_period === "quarterly"
    ? "Quarterly — 3 Months"
    : paymentRequest.renewal_period === "half-yearly"
    ? "Half-Yearly — 6 Months"
    : paymentRequest.renewal_period === "yearly"
    ? "Yearly — 12 Months"
    : paymentRequest.renewal_period || "—"}
</p>

            <p style={{ margin: "6px 0 0" }}>
              Status:{" "}
              {paymentRequest.status === "pending"
                ? "⏳ Pending Verification"
                : paymentRequest.status === "approved"
                ? "✅ Approved"
                : paymentRequest.status === "rejected"
                ? "❌ Rejected"
                : paymentRequest.status}
            </p>
          </div>
        )}
      </div>

{/* QR CODE */}

{qrImageUrl && (
  <div className="renewal-qr">

    <p>
      <strong>Scan & Pay</strong>
    </p>

   <img
  src={qrImageUrl}
  alt="Payment QR"
  className="renewal-qr-image"
/>
  </div>
)}
    </div>
  </div>
)}



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

{/* =========================
    MY COACHING
========================= */}

<section className="coaching-section">

  <div className="coaching-section-header">

    <div>
      <p className="coaching-eyebrow">
        PERSONALIZED COACHING
      </p>

      <h2>
        🏆 My Coaching
      </h2>

      <p className="coaching-subtitle">
        Your personalised plans, attendance, progress and transformation journey.
      </p>
    </div>

  </div>


  <div className="coaching-grid">

    {/* =========================
        WORKOUT PLAN
    ========================= */}

    <div
      className="coaching-card"
      onClick={() =>
        navigate("/member-dashboard/workout-plan")
      }
    >

      <div className="coaching-card-top">

        <div className="coaching-card-icon">
          🏋️
        </div>

        <span className="coaching-card-badge">
          TRAINING
        </span>

      </div>

      <div className="coaching-card-content">

        <h3>
          Workout Plan
        </h3>

        <p>
          View your weekly workout schedule, exercises and
          training programme designed by your coach.
        </p>

        <div className="coaching-card-link">
          View Workout Plan →
        </div>

      </div>

    </div>


    {/* =========================
        DIET PLAN
    ========================= */}

    <div
      className="coaching-card"
      onClick={() =>
        navigate("/member-diet-plan")
      }
    >

      <div className="coaching-card-top">

        <div className="coaching-card-icon">
          🥗
        </div>

        <span className="coaching-card-badge">
          NUTRITION
        </span>

      </div>

      <div className="coaching-card-content">

        <h3>
          Personalized Nutrition
        </h3>

        <p>
          View your daily nutrition plan, meals,
          hydration guide and dietary recommendations.
        </p>

        <div className="coaching-card-link">
          View Diet Plan →
        </div>

      </div>

    </div>


    {/* =========================
        ATTENDANCE
    ========================= */}

<div
  className="coaching-card"
  onClick={() => {
    setShowAttendanceHistory(true);

    setTimeout(() => {
      document
        .getElementById("attendance-history")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }}
>
  <div className="coaching-card-top">

    <div className="coaching-card-icon">
      📋
    </div>

    <span className="coaching-card-badge">
      ATTENDANCE
    </span>

  </div>

  <div className="coaching-card-content">

    <h3>
      Attendance
    </h3>

    <p>
      Track your gym visits, check-in history
      and maintain your training consistency.
    </p>

    <div className="coaching-card-link">
      View Attendance History →
    </div>

  </div>
</div>

    {/* =========================
        TRANSFORMATION
    ========================= */}

    <div
      className="coaching-card"
      onClick={() =>
        navigate("/member-dashboard/my-transformation")
      }
    >

      <div className="coaching-card-top">

        <div className="coaching-card-icon">
          ❤️
        </div>

        <span className="coaching-card-badge">
          PROGRESS
        </span>

      </div>

      <div className="coaching-card-content">

        <h3>
          My Transformation
        </h3>

        <p>
          Track your measurements, progress,
          transformation photos and coach notes.
        </p>

        <div className="coaching-card-link">
          View Transformation →
        </div>

      </div>

    </div>

  </div>

</section>

{showAttendanceHistory && (
  <div
    id="attendance-history"
    className="attendance-history-panel"
    style={{
      marginTop: "20px",
      background: "#111",
      border: "1px solid #333",
      borderRadius: "18px",
      padding: "24px",
    }}
  >
    <h2>📅 Attendance History</h2>

    {attendance.length === 0 ? (
      <p style={{ opacity: 0.7 }}>
        No attendance records found.
      </p>
    ) : (
      <div style={{ marginTop: "20px" }}>
        {attendance.map((item, index) => {
          const checkIn = item.check_in
            ? new Date(item.check_in)
            : null;

          const checkOut = item.check_out
            ? new Date(item.check_out)
            : null;

          let duration = "Currently Checked In";

          if (checkIn && checkOut) {
            const minutes = Math.floor(
              (checkOut - checkIn) / 60000
            );

            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;

            duration =
              hours > 0
                ? `${hours}h ${mins}m`
                : `${mins}m`;
          }

          return (
            <div
              key={item.id || index}
              style={{
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "14px",
                background: "#1b1b1b",
                border: "1px solid #333",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>
                    📅{" "}
                    {checkIn
                      ? checkIn.toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Unknown Date"}
                  </strong>

                  <p style={{ margin: "8px 0 0" }}>
                    🟢 Check-in:{" "}
                    {checkIn
                      ? checkIn.toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—"}
                  </p>

                  <p style={{ margin: "5px 0 0" }}>
                    🔴 Check-out:{" "}
                    {checkOut
                      ? checkOut.toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Still in gym"}
                  </p>
                </div>

                <div
                  style={{
                    alignSelf: "center",
                    fontWeight: "700",
                    color: "#ff4438",
                  }}
                >
                  ⏱ {duration}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
    </div>
  );
}