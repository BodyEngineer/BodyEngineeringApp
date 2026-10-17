import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function OnlineDashboard() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [settings, setSettings] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [renewalPeriod, setRenewalPeriod] = useState("monthly");

  const [qrImageUrl, setQrImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/member-login");
        return;
      }

      const { data: clientData, error: clientError } =
        await supabase
          .from("online_clients")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

      if (clientError) throw clientError;

      setClient(clientData);

      const { data: settingsData, error: settingsError } =
        await supabase
          .from("website_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

      if (settingsError) throw settingsError;

      setSettings(settingsData);

      const { data: requestData, error: requestError } =
        await supabase
          .from("payment_requests")
          .select("*")
          .eq("online_client_id", clientData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (requestError) throw requestError;

      setPaymentRequest(requestData || null);

      const { data: qrData, error: qrError } =
        await supabase.storage
          .from("payment-media")
          .createSignedUrl("gpay-qr.jpeg", 3600);

      if (qrError) {
        console.error("Payment QR error:", qrError);
      } else {
        setQrImageUrl(qrData?.signedUrl || "");
      }

      if (requestData?.status === "pending") {
        setRenewalPeriod(
          requestData.renewal_period || "monthly"
        );
      }
    } catch (err) {
      console.error("Online dashboard error:", err);
      setError(err.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit() {
    if (!client?.id) {
      setMessage("Client information is unavailable.");
      return;
    }

    if (!paymentFile) {
      setMessage("Please select your payment screenshot.");
      return;
    }

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setMessage("Please enter a valid payment amount.");
      return;
    }

    if (paymentRequest?.status === "pending") {
      setMessage("Your payment is already awaiting verification.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please log in again.");

      const extension =
        paymentFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `${client.id}/${Date.now()}.${extension}`;

      // 1. Upload screenshot first.
      const { error: uploadError } = await supabase.storage
        .from("payment-media")
        .upload(filePath, paymentFile, {
          contentType: paymentFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Create the payment request for this online client.
      const paymentData = {
        online_client_id: client.id,
        amount: Number(paymentAmount),
        screenshot_url: filePath,
        status: "pending",
        payment_method: "online",
        payment_date: new Date().toISOString().split("T")[0],
        renewal_period: renewalPeriod,
      };

      const { data: requestData, error: requestError } =
        await supabase
          .from("payment_requests")
          .insert(paymentData)
          .select()
          .single();

      if (requestError) {
        // Remove the uploaded image if saving the request fails.
        const { error: cleanupError } = await supabase.storage
          .from("payment-media")
          .remove([filePath]);

        if (cleanupError) {
          console.error("Screenshot cleanup error:", cleanupError);
        }

        throw requestError;
      }

      setPaymentRequest(requestData);
      setPaymentFile(null);
      setPaymentAmount("");
      setMessage(
        "Payment submitted successfully! Waiting for owner approval."
      );
    } catch (err) {
      console.error("Online payment submission error:", err);
      setMessage(
        err.message || "Payment submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    navigate("/member-login");
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page">
        <div className="alert alert-error">
          {error || "Online client profile could not be found."}
        </div>
        <button className="view-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    );
  }

  const today = new Date();

  const expiry = client.expiry_date
    ? new Date(`${client.expiry_date}T00:00:00`)
    : null;

  const daysRemaining = expiry
    ? Math.ceil((expiry - new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )) / (1000 * 60 * 60 * 24))
    : null;

  const isExpired = daysRemaining === null || daysRemaining < 0;

  const renewalOptions = {
    monthly: 1,
    quarterly: 3,
    "half-yearly": 6,
    yearly: 12,
  };

  function getExpiryPreview() {
    const baseDate =
      expiry && expiry > new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
        ? new Date(expiry)
        : new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

    baseDate.setMonth(
      baseDate.getMonth() + renewalOptions[renewalPeriod]
    );

    return baseDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const renewalLabel = (period) =>
    ({
      monthly: "Monthly — 1 Month",
      quarterly: "Quarterly — 3 Months",
      "half-yearly": "Half-Yearly — 6 Months",
      yearly: "Yearly — 12 Months",
    })[period] || period || "Not specified";

  const statusLabel = {
    pending: "⏳ Pending Verification",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
  };

  return (
    <div className="page">
      <div className="premium-hero">
        <div>
          <p className="hero-brand">BODY ENGINEERING</p>
          <h1>
            👋 Welcome,
            <br />
            {client.full_name}
          </h1>
          <p>Your transformation journey starts today.</p>
        </div>

        <div className="hero-right">
          <span className="status-pill">
            {client.status || (isExpired ? "Expired" : "Active")}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="assessment-card">
        <h2>📋 My Membership</h2>

        <div className="quick-grid">
          <div className="quick-card">
            <h3>Membership Plan</h3>
            <p>{client.membership_type || "Online Coaching"}</p>
          </div>

          <div className="quick-card">
            <h3>Expiry Date</h3>
            <p>
              {expiry
                ? expiry.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Not set"}
            </p>
          </div>

          <div className="quick-card">
            <h3>Membership Status</h3>
            <p>
              {isExpired
                ? "🔴 Expired / Not Set"
                : daysRemaining === 0
                ? "⚠️ Expires Today"
                : `🟢 ${daysRemaining} days remaining`}
            </p>
          </div>
        </div>
      </section>

      <section
        className="assessment-card"
        style={{ marginTop: 24 }}
      >
        <h2>
          {isExpired ? "🚨 Renew Your Membership" : "🔄 Membership Renewal"}
        </h2>

        <p>
          Select your renewal period and submit your payment proof.
          Your membership will update after the owner approves payment.
        </p>

        <div
          style={{
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <label
              style={{ display: "block", marginBottom: 8 }}
            >
              Renewal Period
            </label>

            <select
              value={renewalPeriod}
              onChange={(e) => setRenewalPeriod(e.target.value)}
              disabled={
                submitting || paymentRequest?.status === "pending"
              }
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 12,
                borderRadius: 10,
              }}
            >
              <option value="monthly">Monthly — 1 Month</option>
              <option value="quarterly">Quarterly — 3 Months</option>
              <option value="half-yearly">Half-Yearly — 6 Months</option>
              <option value="yearly">Yearly — 12 Months</option>
            </select>

            <p style={{ marginTop: 14 }}>
              <strong>New expiry preview:</strong> {getExpiryPreview()}
            </p>

            <p>
              <strong>UPI ID:</strong>{" "}
              {settings?.upi_id || "Please contact the owner"}
            </p>

            <label
              style={{ display: "block", margin: "20px 0 8px" }}
            >
              Payment Amount (₹)
            </label>

            <input
              type="number"
              min="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount paid"
              disabled={
                submitting || paymentRequest?.status === "pending"
              }
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 12,
                borderRadius: 10,
              }}
            />

            <label
              style={{ display: "block", margin: "20px 0 8px" }}
            >
              Payment Screenshot
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setPaymentFile(e.target.files?.[0] || null)
              }
              disabled={
                submitting || paymentRequest?.status === "pending"
              }
            />

            {paymentFile && (
              <p style={{ marginTop: 8 }}>
                Selected: {paymentFile.name}
              </p>
            )}

            <button
              type="button"
              className="view-btn"
              onClick={handlePaymentSubmit}
              disabled={
                submitting || paymentRequest?.status === "pending"
              }
              style={{ marginTop: 18 }}
            >
              {submitting ? "Uploading..." : "💳 Submit Payment"}
            </button>

            {message && (
              <p style={{ marginTop: 14, fontWeight: 600 }}>
                {message}
              </p>
            )}
          </div>

          {qrImageUrl && (
            <div style={{ textAlign: "center", minWidth: 200 }}>
              <h3>Scan & Pay</h3>
              <img
                src={qrImageUrl}
                alt="UPI payment QR code"
                style={{
                  width: 190,
                  maxWidth: "100%",
                  background: "#fff",
                  padding: 10,
                  borderRadius: 12,
                }}
              />
            </div>
          )}
        </div>
      </section>

      {paymentRequest && (
        <section
          className="assessment-card"
          style={{ marginTop: 24 }}
        >
          <h2>💳 Latest Payment Request</h2>
          <p>
            <strong>Amount:</strong>{" "}
            ₹{Number(paymentRequest.amount || 0).toLocaleString("en-IN")}
          </p>
          <p>
            <strong>Renewal:</strong>{" "}
            {renewalLabel(paymentRequest.renewal_period)}
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(paymentRequest.created_at).toLocaleDateString(
              "en-IN"
            )}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {statusLabel[paymentRequest.status] ||
              paymentRequest.status}
          </p>

          {paymentRequest.status === "rejected" && (
            <p>
              Your previous payment was rejected. You can submit a new
              payment request.
            </p>
          )}
        </section>
      )}

      <section
        className="assessment-card"
        style={{ marginTop: 24 }}
      >
        <h2>🏋️ My Coaching</h2>

        <div className="quick-grid">
          <div className="quick-card">
            🍽
            <h3>Diet Plan</h3>
            <p>Coming Soon</p>
          </div>

          <div className="quick-card">
            💪
            <h3>Workout Plan</h3>
            <p>Coming Soon</p>
          </div>

          <div className="quick-card">
            📸
            <h3>Weekly Check-In</h3>
            <p>Coming Soon</p>
          </div>

          <div className="quick-card">
            📈
            <h3>Transformation</h3>
            <p>Coming Soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}