import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import EnableNotifications from "../components/EnableNotifications";

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
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);

  // =========================
  // STUDIO ANNOUNCEMENTS
  // =========================

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadMember();
  }, []);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/member-login");
  };

  // =========================
  // LOAD STUDIO ANNOUNCEMENTS
  // GYM MEMBERS ONLY
  // =========================

  const loadAnnouncements = async (memberData, type) => {
    if (
      type !== "gym" ||
      !memberData?.owner_id ||
      !memberData?.membership_end
    ) {
      setAnnouncements([]);
      return;
    }

    const expiryDate = new Date(
      `${memberData.membership_end}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      setAnnouncements([]);
      return;
    }

    try {
      setAnnouncementsLoading(true);
      setAnnouncementError("");

      const { data, error } = await supabase
        .from("studio_notifications")
        .select("*")
        .eq("owner_id", memberData.owner_id)
        .eq("status", "sent")
        .eq("recipient_type", "active_gym_members")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error) {
      console.error("Announcement loading error:", error);
      setAnnouncementError(
        "Unable to load studio announcements. Please try again."
      );
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // =========================
  // LOAD MEMBER DATA
  // =========================

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

    // -------------------------
    // FIND GYM MEMBER
    // -------------------------

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

      return data;
    }

    // -------------------------
    // FIND ONLINE CLIENT
    // -------------------------

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

      return data;
    }

    // -------------------------
    // IDENTIFY MEMBER TYPE
    // -------------------------

    let memberData = await loadGymMember(user.id);
    let resolvedMemberType = "gym";

    if (!memberData) {
      memberData = await loadOnlineClient(user.id);
      resolvedMemberType = "online";
    }

    if (!memberData) {
      console.log("No member found for logged-in user.");
      return;
    }

    setMember(memberData);
    setMemberType(resolvedMemberType);

    // -------------------------
    // LOAD ANNOUNCEMENTS
    // -------------------------

    if (resolvedMemberType === "gym") {
      await loadAnnouncements(memberData, "gym");
    } else {
      setAnnouncements([]);
    }

    // =========================
    // WEBSITE SETTINGS + QR
    // =========================

    const { data: settingsData, error: settingsError } =
      await supabase
        .from("website_settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (settingsError) {
      console.log("Website settings error:", settingsError);
    }

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
    // GYM MEMBERS ONLY
    // =========================

    if (resolvedMemberType === "gym") {
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

        const todaySessions = (attendanceData || []).filter(
          (item) => {
            const checkIn = new Date(item.check_in);
            return checkIn >= today && checkIn < tomorrow;
          }
        );

        const latestTodaySession = todaySessions[0] || null;

        const openSession = todaySessions.find(
          (item) => !item.check_out
        );

        setCheckedInToday(Boolean(latestTodaySession));

        setCheckedOutToday(
          Boolean(latestTodaySession && !openSession)
        );
      }
    } else {
      setAttendance([]);
      setCheckedInToday(false);
      setCheckedOutToday(false);
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
      setPaymentMessage(
        "Please select your payment screenshot."
      );
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

      // GET CURRENT USER

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please login again.");
      }

      // UNIQUE FILE PATH

      const fileExtension =
        paymentFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `${member.id}/${Date.now()}.${fileExtension}`;

      // UPLOAD SCREENSHOT

      const {
        error: uploadError,
      } = await supabase.storage
        .from("payment-media")
        .upload(filePath, paymentFile, {
          contentType: paymentFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "Payment screenshot upload error:",
          uploadError
        );

        throw new Error(
          `Screenshot upload failed: ${uploadError.message}`
        );
      }

      // CREATE PAYMENT REQUEST

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

      const {
        data: requestData,
        error: requestError,
      } = await supabase
        .from("payment_requests")
        .insert(paymentData)
        .select()
        .single();

      if (requestError) {
        console.error(
          "Payment request error:",
          requestError
        );

        await supabase.storage
          .from("payment-media")
          .remove([filePath]);

        throw new Error(
          "Unable to create payment request."
        );
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

  // =========================
  // LOADING SCREEN
  // =========================

  if (!member) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // =========================
  // MEMBERSHIP STATUS
  // =========================

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
    ? Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const isExpired = !expiry || daysRemaining < 0;
  const displayDays = Math.abs(daysRemaining);
  const showRenewalCard = true;

  const totalVisits = attendance.length;

  const lastVisit =
    attendance.length > 0
      ? new Date(
          attendance[0].check_in
        ).toLocaleDateString()
      : "No Visits";

  return (
    <div className="member-dashboard-page">

      {/* =========================
          PREMIUM HERO
      ========================= */}

     {/* PREMIUM MEMBER HEADER */}

<header className="member-header" id="member-home">
  <div className="member-brand">
    <div className="brand-icon">BE</div>
    <div>
      <div className="brand-title">BODY ENGINEERING</div>
      <div className="brand-subtitle">MEMBER CLUB</div>
    </div>
  </div>

  <div className="header-actions">
    <button
      type="button"
      className="header-icon-btn"
      onClick={() =>
        document.getElementById("studio-announcements")
          ?.scrollIntoView({ behavior: "smooth" })
      }
      aria-label="Studio announcements"
    >
      🔔
    </button>

    <button
      type="button"
      className="header-icon-btn"
      onClick={handleLogout}
      aria-label="Sign out"
    >
      ↗️
    </button>
  </div>
</header>

{/* WELCOME SECTION */}

<section className="welcome-section">
  <div>
    <p className="welcome-eyebrow">YOUR FITNESS JOURNEY</p>

    <h1 className="welcome-title">
      Welcome back,
      <br />
      <span>{member.full_name}</span>
    </h1>

    <p className="welcome-description">
      Every workout makes you stronger.
    </p>
  </div>

  <div className="welcome-profile">
    <img
      src={member.profile_photo || "https://i.pravatar.cc/200"}
      alt="Member profile"
      className="welcome-avatar"
    />
  </div>
</section>

{/* MEMBERSHIP CARD */}

<section className="membership-card">
  <div className="membership-heading">
    <div>
      <p className="welcome-eyebrow">YOUR MEMBERSHIP</p>
      <h2>{member.membership_type || "Fitness Membership"}</h2>
    </div>

    <span
      className={`membership-status ${
        isExpired ? "expired" : "active"
      }`}
    >
      {isExpired ? "EXPIRED" : "ACTIVE"}
    </span>
  </div>

  <div className="membership-days">
    <strong>{expiry ? displayDays : "—"}</strong>
    <span>
      {!expiry
        ? "Renewal required"
        : isExpired
        ? "Days expired"
        : "Days remaining"}
    </span>
  </div>

  <div className="membership-caption">
    <span>Membership expiry</span>
    <strong>
      {membershipExpiry
        ? new Date(`${membershipExpiry}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          )
        : "Not available"}
    </strong>
  </div>
</section>

{/* QUICK ACCESS */}

<section className="quick-access-grid">

  <button
    type="button"
    className="quick-access-card"
    onClick={() => navigate("/member-attendance")}
  >
    <span className="quick-access-icon">📋</span>
    <strong>Attendance</strong>
    <span>Track your visits</span>
  </button>

  <button
    type="button"
    className="quick-access-card"
    onClick={() =>
      navigate("/member-dashboard/my-transformation")
    }
  >
    <span className="quick-access-icon">❤️</span>
    <strong>My Progress</strong>
    <span>Track your journey</span>
  </button>

  <button
    type="button"
    className="quick-access-card"
    onClick={() => navigate("/member-diet-plan")}
  >
    <span className="quick-access-icon">🥗</span>
    <strong>Diet Plan</strong>
    <span>Your nutrition guide</span>
  </button>

  <button
    type="button"
    className="quick-access-card"
    onClick={() =>
      navigate("/member-dashboard/workout-plan")
    }
  >
    <span className="quick-access-icon">🏋️</span>
    <strong>Workout Plan</strong>
    <span>Your training schedule</span>
  </button>

</section>

     {/* =========================
    STUDIO ANNOUNCEMENTS
========================= */}

{memberType === "gym" && (
  <section
    id="studio-announcements"
    className="announcement-section"
  >
    <div className="announcement-heading">
      <div>
        <p className="welcome-eyebrow">
          BODY ENGINEERING
        </p>

        <h2>Studio Announcements</h2>

        <p className="announcement-description">
          Latest updates from your fitness studio.
        </p>
      </div>

      <button
        type="button"
        className="announcement-new"
        onClick={() =>
          loadAnnouncements(member, memberType)
        }
        disabled={announcementsLoading}
      >
        {announcementsLoading ? "Loading..." : "↻ Refresh"}
      </button>
    </div>

    {announcementsLoading ? (
      <div className="announcement-item">
        Loading announcements...
      </div>
    ) : announcementError ? (
      <div className="announcement-item">
        <p>{announcementError}</p>

        <button
          type="button"
          className="announcement-new"
          onClick={() =>
            loadAnnouncements(member, memberType)
          }
        >
          Try Again
        </button>
      </div>
    ) : announcements.length === 0 ? (
      <div className="announcement-item">
        <div className="quick-access-icon">📢</div>

        <h3>No Announcements Yet</h3>

        <p className="announcement-description">
          Your studio updates will appear here.
        </p>
      </div>
    ) : (
      <div>
        {announcements
          .slice(
            0,
            showAnnouncementHistory
              ? announcements.length
              : 1
          )
          .map((announcement) => {
            const announcementDate =
              announcement.sent_at ||
              announcement.created_at;

            return (
              <article
                key={announcement.id}
                className="announcement-item"
              >
                <div className="announcement-item-header">
                  <strong>📢 Studio Update</strong>

                  <span>
                    {announcementDate
                      ? new Date(
                          announcementDate
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </span>
                </div>

                <p className="announcement-message">
                  {announcement.message}
                </p>
              </article>
            );
          })}

        {announcements.length > 1 && (
          <button
            type="button"
            className="announcement-history-toggle"
            onClick={() =>
              setShowAnnouncementHistory(
                (prev) => !prev
              )
            }
          >
            {showAnnouncementHistory
              ? "Hide Announcement History ↑"
              : `View Announcement History (${announcements.length - 1}) ↓`}
          </button>
        )}
      </div>
    )}
  </section>
)}

     {/* STUDIO NOTIFICATION SETTINGS */}

{memberType === "gym" && (
  <EnableNotifications memberType={memberType} />
)}

{/* =========================
  MEMBERSHIP RENEWAL
========================= */}

{showRenewalCard && websiteSettings && (
<div className="renewal-card">

  {/* RENEWAL HEADER */}

  <div className="renewal-card-header">
    <div>
      <span className="renewal-eyebrow">
        BODY ENGINEERING
      </span>

      <h2 className="renewal-card-title">
        Membership Renewal
      </h2>

      <p className="renewal-summary-text">
        {isExpired
          ? `Your membership expired ${Math.abs(daysRemaining)} days ago.`
          : `Your membership expires in ${daysRemaining} days.`}
      </p>
    </div>

    <span
      className={`renewal-status ${
        isExpired ? "expired" : "active"
      }`}
    >
      {isExpired ? "EXPIRED" : "ACTIVE"}
    </span>
  </div>

  {/* TOGGLE BUTTON */}

  <button
    type="button"
    className="renewal-toggle"
    onClick={() => setShowRenewalForm((prev) => !prev)}
  >
    {showRenewalForm
      ? "Close Renewal Form ↑"
      : "Renew Membership →"}
  </button>

  {/* PAYMENT FORM */}

  {showRenewalForm && (
    <div className="renewal-layout">

      <div className="renewal-details">

        <div className="renewal-field">
          <label>Renewal Period</label>

          <select
            value={renewalPeriod}
            onChange={(e) => setRenewalPeriod(e.target.value)}
            disabled={
              paymentSubmitting ||
              paymentRequest?.status === "pending"
            }
          >
            <option value="monthly">Monthly — 1 Month</option>
            <option value="quarterly">Quarterly — 3 Months</option>
            <option value="half-yearly">Half-Yearly — 6 Months</option>
            <option value="yearly">Yearly — 12 Months</option>
          </select>
        </div>

        <div className="renewal-upi">
          <span>UPI ID</span>
          <strong>
            {websiteSettings.upi_id || "Not available"}
          </strong>
        </div>

        <div className="renewal-field">
          <label>Payment Amount (₹)</label>

          <input
            type="number"
            min="1"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter amount paid"
            disabled={paymentSubmitting}
          />
        </div>

        <div className="renewal-field">
          <label>Payment Screenshot</label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setPaymentFile(e.target.files?.[0] || null)
            }
            disabled={paymentSubmitting}
          />

          {paymentFile && (
            <p className="renewal-file-name">
              📎 {paymentFile.name}
            </p>
          )}
        </div>

        <button
          type="button"
          className="renewal-submit-btn"
          onClick={handlePaymentSubmit}
          disabled={
            paymentSubmitting ||
            paymentRequest?.status === "pending"
          }
        >
          {paymentSubmitting
            ? "Uploading..."
            : paymentRequest?.status === "pending"
            ? "Verification Pending"
            : "Submit Renewal Payment"}
        </button>

        {paymentMessage && (
          <p className="renewal-message">{paymentMessage}</p>
        )}

        {paymentRequest && (
          <div className="renewal-request-status">
            <strong>Payment Request Status</strong>

            <p>Amount: ₹{paymentRequest.amount}</p>

            <p>
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

            <p>
              Status:{" "}
              {paymentRequest.status === "pending"
                ? "Pending Verification"
                : paymentRequest.status === "approved"
                ? "Approved"
                : paymentRequest.status === "rejected"
                ? "Rejected"
                : paymentRequest.status}
            </p>
          </div>
        )}

      </div>

      {qrImageUrl && (
        <div className="renewal-qr">
          <p><strong>SCAN & PAY</strong></p>

          <img
            src={qrImageUrl}
            alt="Payment QR"
            className="renewal-qr-image"
          />

          <span>Scan using any UPI app</span>
        </div>
      )}

    </div>
  )}

</div>
)}
   {/* FITNESS OVERVIEW */}

<section className="dashboard-section">
  <div className="dashboard-section-title">
    <div>
      <p className="welcome-eyebrow">YOUR PERFORMANCE</p>
      <h2>Fitness Overview</h2>
      <p className="fitness-overview-subtitle">
        Track your progress and stay consistent.
      </p>
    </div>
  </div>

  <div className="fitness-metrics">

    <div className="metric-card">
      <span className="metric-icon">⚖️</span>
      <strong className="metric-value">
        {assessment?.weight || "--"}
        <small> kg</small>
      </strong>
      <span className="metric-label">Current Weight</span>
    </div>

    <div className="metric-card">
      <span className="metric-icon">❤️</span>
      <strong className="metric-value">
        {assessment?.bmi || "--"}
      </strong>
      <span className="metric-label">BMI</span>
    </div>

    <div className="metric-card">
      <span className="metric-icon">💧</span>
      <strong className="metric-value">
        {assessment?.body_fat || "--"}
        <small>%</small>
      </strong>
      <span className="metric-label">Body Fat</span>
    </div>

    {memberType === "gym" && (
      <div className="metric-card">
        <span className="metric-icon">🏋️</span>
        <strong className="metric-value">
          {totalVisits}
        </strong>
        <span className="metric-label">Total Visits</span>
      </div>
    )}

  </div>

  <button
    type="button"
    className="profile-action-card"
    onClick={() => navigate("/member-dashboard/profile")}
  >
    <span className="profile-action-icon">👤</span>

    <span className="profile-action-content">
      <strong>My Profile</strong>
      <small>View and update your personal information</small>
    </span>

    <span className="profile-action-arrow">→</span>
  </button>

  {memberType === "gym" && (
  <button
    type="button"
    className="profile-action-card"
    onClick={() => {
      setShowAttendanceHistory((prev) => !prev);

      setTimeout(() => {
        document
          .getElementById("attendance-history")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }}
  >
    <span className="profile-action-icon">📅</span>

    <span className="profile-action-content">
      <strong>
        {showAttendanceHistory
          ? "Hide Attendance History"
          : "Attendance History"}
      </strong>
      <small>
        View your previous gym visits and workout duration
      </small>
    </span>

    <span className="profile-action-arrow">→</span>
  </button>
)}

</section>
    
      {/* =========================
          ATTENDANCE HISTORY
      ========================= */}

{showAttendanceHistory && memberType === "gym" && (
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

        {/* MOBILE & TABLET BOTTOM NAVIGATION */}

<nav className="member-bottom-nav">
  <button
    type="button"
    className="member-nav-item active"
    onClick={() =>
      document.getElementById("member-home")
        ?.scrollIntoView({ behavior: "smooth" })
    }
  >
    <span>⌂</span>
    <small>Home</small>
  </button>

  <button
    type="button"
    className="member-nav-item"
    onClick={() => navigate("/member-attendance")}
  >
    <span>▦</span>
    <small>Attendance</small>
  </button>

  <button
    type="button"
    className="member-nav-item"
    onClick={() =>
      navigate("/member-dashboard/my-transformation")
    }
  >
    <span>↗️</span>
    <small>Progress</small>
  </button>

  <button
    type="button"
    className="member-nav-item"
    onClick={() =>
      navigate("/member-dashboard/profile")
    }
  >
    <span>◎</span>
    <small>Profile</small>
  </button>
</nav>

    </div>
  );
}