import Header from "../components/Header";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { useOnlineClients } from "../hooks/useOnlineClients";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";


export default function OnlineClients() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clients, loading } = useOnlineClients();
  const [search, setSearch] = useState("");
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewalPeriod, setRenewalPeriod] = useState("monthly");
  const [renewalAmount, setRenewalAmount] = useState("");
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const renewId = searchParams.get("renew");
  
    if (!renewId || !clients?.length) return;
  
    const clientToRenew = clients.find(
      (client) => client.id === renewId
    );
  
    if (clientToRenew) {
      setRenewTarget(clientToRenew);
      setRenewalPeriod("monthly");
      setRenewalAmount("");
  
      // Remove ?renew=... from the URL
      setSearchParams({});
    }
  }, [clients, searchParams, setSearchParams]);

  const handleCashRenewal = async () => {
    if (!renewTarget) return;
  
    const monthsMap = {
      monthly: 1,
      quarterly: 3,
      "half-yearly": 6,
      yearly: 12,
    };
  
    const months = monthsMap[renewalPeriod];
  
    if (!months) {
      alert("Please select a renewal period.");
      return;
    }
  
    const amount = Number(renewalAmount);
  
    if (!amount || amount <= 0) {
      alert("Please enter the renewal amount.");
      return;
    }
  
    try {
      setRenewing(true);
  
      // Get logged-in owner once
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        throw new Error("You are not logged in.");
      }
  
      const today = new Date();
  
      // Active membership:
      // extend from existing expiry.
      //
      // Expired/no expiry:
      // start from today's payment date.
      let baseDate = today;
  
      if (renewTarget.expiry_date) {
        const expiryDate = new Date(renewTarget.expiry_date);
  
        if (expiryDate > today) {
          baseDate = expiryDate;
        }
      }
  
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);
  
      const paymentDate = today.toISOString().split("T")[0];
      const now = new Date().toISOString();
  
      // 1️⃣ Update online client membership
      const updateData = {
        expiry_date: newExpiry.toISOString().split("T")[0],
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      };
      
      // If membership is expired, this renewal starts today.
      // If membership is still active, keep the original start date.
      if (!renewTarget.expiry_date || new Date(renewTarget.expiry_date) <= today) {
        updateData.start_date = paymentDate;
      }
      
      const { error: updateError } = await supabase
        .from("online_clients")
        .update(updateData)
        .eq("id", renewTarget.id)
        .eq("owner_id", user.id);
  
      if (updateError) {
        throw updateError;
      }
  
      // 2️⃣ Record cash payment
      const { error: paymentError } = await supabase
        .from("payment_requests")
        .insert({
          online_client_id: renewTarget.id,
          amount,
          renewal_period: renewalPeriod,
          payment_method: "cash",
          payment_date: paymentDate,
          status: "approved",
          approved_by: user.id,
          approved_at: now,
        });
  
      if (paymentError) {
        throw paymentError;
      }
  
      alert(
        `Cash renewal recorded successfully! ✅\n\n` +
        `Client: ${renewTarget.full_name}\n` +
        `Plan: ${renewalPeriod}\n` +
        `New Expiry: ${newExpiry.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      );
  
      setRenewTarget(null);
      setRenewalPeriod("monthly");
      setRenewalAmount("");
  
      window.location.reload();
    } catch (error) {
      console.error("Online client cash renewal error:", error);
      alert(error.message || "Failed to renew online client.");
    } finally {
      setRenewing(false);
    }
  };
  
  const sendWhatsAppReminder = (client) => {
    if (!client?.phone) {
      alert("This client does not have a phone number.");
      return;
    }
  
    // Remove spaces, +, -, brackets and any other non-numeric characters
    const phone = String(client.phone).replace(/\D/g, "");
  
    // Handle Indian numbers
    let whatsappNumber = phone;
  
    if (phone.length === 10) {
      whatsappNumber = `91${phone}`;
    } else if (phone.length === 12 && phone.startsWith("91")) {
      whatsappNumber = phone;
    } else {
      alert(
        "Please enter a valid 10-digit Indian mobile number for this client."
      );
      return;
    }
  
    const expiryText = client.expiry_date
      ? new Date(client.expiry_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "not available";
  
    const message = `Hello ${client.full_name},
  
  This is a friendly reminder from Body Engineering regarding your online coaching membership.
  
  Your current membership expires on ${expiryText}.
  
  Please renew your membership to continue your coaching without interruption.
  
  Thank you,
  Body Engineering`;
  
    const url = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message
    )}`;
  
    window.open(url, "_blank");
  };
  
    return (
      <div className="page">

      <Header
        title="Online Clients"
        subtitle="Manage your online coaching clients"
        onMenuClick={openSidebar}
      />

      <div className="assessment-card">
        <h2>🌍 Online Coaching</h2>

        <p>Manage all your online clients from one place.</p>

      </div>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
  <input
    type="text"
    placeholder="🔍 Search by name, phone or email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "14px 18px",
      borderRadius: "12px",
      border: "1px solid #444",
      background: "#1e1e1e",
      color: "#fff",
      fontSize: "16px",
    }}
  />
</div>

      <div style={{ marginTop: "20px" }}>
  <button
    className="btn btn-primary"
    onClick={() => navigate("/online-clients/add")}
  >
    ➕ Add New Online Client
  </button>
</div>

<h2 style={{ marginTop: "30px", marginBottom: "20px" }}>
    👥 Online Clients ({clients.length})
</h2>

      <div style={{ marginTop: "24px" }}>
        {loading ? (
          <p>Loading online clients...</p>
        ) : clients.length === 0 ? (
          <div className="assessment-card">
            <h3>No Online Clients Yet</h3>
            <p>Click "Add Online Client" to add your first client.</p>
          </div>
        ) : (
            clients
            .filter((client) => {
              const term = search.toLowerCase();
          
              return (
                client.full_name?.toLowerCase().includes(term) ||
                client.phone?.includes(term) ||
                client.email?.toLowerCase().includes(term)
              );
            })
            .map((client) => (

                <div
  className="assessment-card"
  key={client.id}
  onClick={() => navigate(`/online-clients/${client.id}`)}
  style={{
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px",
    borderRadius: "18px",
    transition: "0.3s",
  }}
>
  {/* Left Side */}

  <div style={{ flex: 1, paddingRight: "40px" }}>

  <h2
  style={{
      fontSize: "30px",
      fontWeight: "700",
      marginBottom: "18px",
  }}
>
    {client.full_name}
</h2>

<p>🎯 {client.goal}</p>

<p>💰 ₹{client.monthly_fee}</p>

<p>📦 {client.package_type}</p>

<p>
  📅 <strong>Start:</strong>{" "}
  {client.start_date
    ? new Date(client.start_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set"}
</p>

<p>
  🏁 <strong>End:</strong>{" "}
  {client.expiry_date
    ? new Date(client.expiry_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No expiry"}
</p>

  </div>

  {/* Right Side */}

  <div
  style={{
    width: "180px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  }}
>
{client.profile_photo ? (
  <img
    src={client.profile_photo}
    alt={client.full_name}
    style={{
      width: "180px",
      height: "180px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "4px solid #ff4d4d",
      marginBottom: "12px",
    }}
  />
) : (
  <div
    style={{
      width: "180px",
      height: "180px",
      borderRadius: "50%",
      background: "linear-gradient(135deg,#ff4d4d,#ff8a00)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "60px",
      fontWeight: "700",
      color: "#fff",
      marginBottom: "12px",
      border: "4px solid rgba(255,255,255,0.15)",
    }}
  >
    {client.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()}
  </div>
)}

<div
  style={{
    padding: "6px 16px",
    borderRadius: "30px",
    background:
      client.status === "active"
        ? "rgba(50,215,75,.15)"
        : "rgba(255,69,58,.15)",
    color:
      client.status === "active"
        ? "#32d74b"
        : "#ff453a",
    fontWeight: "600",
    marginBottom: "12px",
    display: "inline-block",
  }}
>
  {client.status === "active"
    ? "🟢 Active"
    : "🔴 Inactive"}
</div>



<button
  className="btn btn-primary"
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/online-clients/${client.id}`);
  }}
>
  👤 Open Profile
</button>

<button
  className="btn btn-primary"
  onClick={(e) => {
    e.stopPropagation();
    sendWhatsAppReminder(client);
  }}
>
  📲 WhatsApp Reminder
</button>

<button
  className="btn btn-primary"
  onClick={(e) => {
    e.stopPropagation();
    setRenewTarget(client);
    setRenewalPeriod("monthly");
    setRenewalAmount("");
  }}
>
  🔄 Renew
</button>
</div>

  </div>
              
              
            
          ))
        )}
   </div>

{/* Renew Online Client Modal */}
{renewTarget && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px",
    }}
    onClick={() => {
      if (!renewing) setRenewTarget(null);
    }}
  >
    <div
      className="assessment-card"
      style={{
        width: "100%",
        maxWidth: "520px",
        padding: "30px",
        borderRadius: "20px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ marginBottom: "8px" }}>
        🔄 Renew Online Client
      </h2>

      <p style={{ marginBottom: "24px", opacity: 0.8 }}>
        {renewTarget.full_name}
      </p>

      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.05)",
          marginBottom: "20px",
        }}
      >
        <p>
          <strong>Current Package:</strong>{" "}
          {renewTarget.package_type || "Not specified"}
        </p>

        <p>
  <strong>Renewal Amount:</strong>{" "}
  ₹{renewalAmount
    ? Number(renewalAmount).toLocaleString("en-IN")
    : "Enter amount"}
</p>

<label
  style={{
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  }}
>
  Renewal Amount
</label>

<input
  type="number"
  min="0"
  placeholder="Enter payment amount"
  value={renewalAmount}
  onChange={(e) => setRenewalAmount(e.target.value)}
  disabled={renewing}
  style={{
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #444",
    background: "#1e1e1e",
    color: "#fff",
    fontSize: "16px",
    marginBottom: "20px",
    boxSizing: "border-box",
  }}
/>

        <p>
          <strong>Current Expiry:</strong>{" "}
          {renewTarget.expiry_date
            ? new Date(
                renewTarget.expiry_date
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "No expiry date"}
        </p>
      </div>

      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "600",
        }}
      >
        Renewal Period
      </label>

      <select
        value={renewalPeriod}
        onChange={(e) => setRenewalPeriod(e.target.value)}
        disabled={renewing}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #444",
          background: "#1e1e1e",
          color: "#fff",
          fontSize: "16px",
          marginBottom: "20px",
        }}
      >
        <option value="monthly">Monthly — 1 Month</option>
        <option value="quarterly">Quarterly — 3 Months</option>
        <option value="half-yearly">Half Yearly — 6 Months</option>
        <option value="yearly">Yearly — 12 Months</option>
      </select>

      <div
        style={{
          padding: "18px",
          borderRadius: "12px",
          background: "rgba(50,215,75,0.10)",
          marginBottom: "24px",
        }}
      >
        <p style={{ marginBottom: "6px" }}>
          <strong>Payment Method</strong>
        </p>

        <p style={{ fontSize: "18px", margin: 0 }}>
          💵 Cash
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}
      >
        <button
          className="btn"
          onClick={() => setRenewTarget(null)}
          disabled={renewing}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={handleCashRenewal}
          disabled={renewing}
        >
          {renewing
            ? "Processing..."
            : "💵 Confirm Cash Renewal"}
        </button>
      </div>
    </div>
  </div>
)}
</div>
);
}