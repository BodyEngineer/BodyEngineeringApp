import Header from "../components/Header";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { useOnlineClients } from "../hooks/useOnlineClients";

export default function OnlineClients() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const { clients, loading } = useOnlineClients();

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

        <button
          className="btn btn-primary"
          onClick={() => navigate("/online-clients/add")}
        >
          + Add Online Client
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {loading ? (
          <p>Loading online clients...</p>
        ) : clients.length === 0 ? (
          <div className="assessment-card">
            <h3>No Online Clients Yet</h3>
            <p>Click "Add Online Client" to add your first client.</p>
          </div>
        ) : (
          clients.map((client) => (
            <Link
              key={client.id}
              to={`/online-clients/${client.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                className="assessment-card"
                style={{
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
              >
                <h3>{client.full_name}</h3>

                <p>📞 {client.phone || "-"}</p>

                <p>📧 {client.email || "-"}</p>

                <p>🎯 {client.goal || "-"}</p>

                <p>💰 ₹{client.monthly_fee || 0}</p>

                <p>📦 {client.package_type || "-"}</p>

                <p>
                  {client.status === "active"
                    ? "🟢 Active"
                    : "🔴 Inactive"}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}