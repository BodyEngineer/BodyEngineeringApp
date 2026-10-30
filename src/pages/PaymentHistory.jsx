import { useEffect, useMemo, useState } from "react"
import { Search, X, CreditCard } from "lucide-react"
import Header from "../components/Header"
import EmptyState from "../components/EmptyState"
import LoadingSpinner from "../components/LoadingSpinner"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

export default function PaymentHistory() {
  const { user } = useAuth()

  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [onlineClients, setOnlineClients] = useState([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPaymentHistory()
  }, [user])

  const fetchPaymentHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")

      // -----------------------------
      // GYM MEMBERS
      // -----------------------------

      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from("members")
        .select("id, full_name, phone")
        .eq("owner_id", user.id)

      if (memberError) throw memberError

      // -----------------------------
      // ONLINE CLIENTS
      // -----------------------------

      const {
        data: onlineData,
        error: onlineError,
      } = await supabase
        .from("online_clients")
        .select("id, full_name, phone")
        .eq("owner_id", user.id)

      if (onlineError) throw onlineError

      // -----------------------------
      // PAYMENT HISTORY
      // -----------------------------

      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from("payment_requests")
        .select("*")
        .order("payment_date", {
          ascending: false,
          nullsFirst: false,
        })

      if (paymentError) throw paymentError

      // -----------------------------
      // ENRICH PAYMENT DATA
      // -----------------------------

      const enrichedPayments = (paymentData || []).map((payment) => {
        const gymMember = payment.member_id
          ? (memberData || []).find(
              (member) =>
                String(member.id) ===
                String(payment.member_id)
            )
          : null

        const onlineClient = payment.online_client_id
          ? (onlineData || []).find(
              (client) =>
                String(client.id) ===
                String(payment.online_client_id)
            )
          : null

        return {
          ...payment,

          member_name:
            gymMember?.full_name ||
            onlineClient?.full_name ||
            "Unknown Member",

          member_phone:
            gymMember?.phone ||
            onlineClient?.phone ||
            "",
        }
      })

      setMembers(memberData || [])
      setOnlineClients(onlineData || [])
      setPayments(enrichedPayments)
    } catch (error) {
      console.error(
        "Payment history error:",
        error
      )

      setError(
        error?.message ||
          "Unable to load payment history."
      )
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------
  // SEARCH + FILTER
  // ---------------------------------

  const filteredPayments = useMemo(() => {
    const searchText =
      search.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesSearch =
        !searchText ||
        payment.member_name
          ?.toLowerCase()
          .includes(searchText) ||
        payment.member_phone
          ?.toLowerCase()
          .includes(searchText)

      const matchesStatus =
        statusFilter === "all" ||
        payment.status === statusFilter

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [payments, search, statusFilter])

  // ---------------------------------
  // HELPERS
  // ---------------------------------

  const formatRenewal = (period) => {
    if (!period) return "Not specified"

    return period
      .replace("-", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  }

  const formatDate = (date) => {
    if (!date) return "—"

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  const clearSearch = () => {
    setSearch("")
  }

  return (
    <div className="page">

      <Header
        title="Payment History"
        subtitle="View and search all member payment records"
      />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* -------------------------------- */}
      {/* SEARCH + FILTER                  */}
      {/* -------------------------------- */}

      <section
        className="dashboard-section"
        style={{
          marginBottom: "24px",
        }}
      >

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >

          {/* SEARCH */}

          <div
            style={{
              position: "relative",
              flex: "1 1 300px",
            }}
          >

            <Search
              size={19}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                opacity: 0.65,
              }}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search member by name or phone..."
              style={{
                width: "100%",
                padding:
                  "13px 42px 13px 44px",
                borderRadius: "10px",
                border: "1px solid #444",
                background: "#111",
                color: "#fff",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />

            {search && (
              <button
                onClick={clearSearch}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            )}

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              padding: "13px 14px",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#111",
              color: "#fff",
              fontSize: "15px",
            }}
          >
            <option value="all">
              All Payments
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="pending">
              Pending
            </option>
          </select>

        </div>

        {/* RESULT COUNT */}

        <div
          style={{
            marginTop: "14px",
            opacity: 0.7,
            fontSize: "14px",
          }}
        >
          Showing{" "}
          <strong>
            {filteredPayments.length}
          </strong>{" "}
          of{" "}
          <strong>
            {payments.length}
          </strong>{" "}
          payments
        </div>

      </section>

      {/* -------------------------------- */}
      {/* PAYMENT LIST                     */}
      {/* -------------------------------- */}

      {loading ? (
        <div className="page-loading">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredPayments.length === 0 ? (

        <EmptyState
          title={
            search
              ? "No payments found"
              : "No payment history"
          }
          description={
            search
              ? "Try another member name or phone number."
              : "Approved and rejected payments will appear here."
          }
        />

      ) : (

        <section className="dashboard-section">

          <div className="payment-request-list">

            {filteredPayments.map(
              (payment) => {

                const renewalLabel =
                  formatRenewal(
                    payment.renewal_period
                  )

                return (

                  <div
                    key={payment.id}
                    className="payment-request-card"
                  >

                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "flex-start",
                      }}
                    >

                      <div
                        style={{
                          minWidth: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "rgba(255,68,56,0.12)",
                          color: "#ff4438",
                        }}
                      >
                        <CreditCard
                          size={22}
                        />
                      </div>

                      <div>

                        <h3>
                          {payment.member_name}
                        </h3>

                        {payment.member_phone && (
                          <p>
                            📱{" "}
                            {payment.member_phone}
                          </p>
                        )}

                        <p>
                          Amount: ₹
                          {Number(
                            payment.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                        <p>
                          Renewal:{" "}
                          {renewalLabel}
                        </p>

                        <p>
                          Payment Date:{" "}
                          {formatDate(
                            payment.payment_date ||
                              payment.created_at
                          )}
                        </p>

                        <p>
                          Method:{" "}
                          {payment.payment_method
                            ? payment.payment_method
                                .charAt(0)
                                .toUpperCase() +
                              payment.payment_method.slice(
                                1
                              )
                            : "Not specified"}
                        </p>

                        {payment.approved_at && (
                          <p>
                            Approved:{" "}
                            {formatDate(
                              payment.approved_at
                            )}
                          </p>
                        )}

                        <span
                          className={
                            payment.status ===
                            "approved"
                              ? "status-success"
                              : payment.status ===
                                "rejected"
                              ? "status-danger"
                              : "status-warning"
                          }
                        >
                          {payment.status ===
                          "approved"
                            ? "✅ Approved"
                            : payment.status ===
                              "rejected"
                            ? "❌ Rejected"
                            : "⏳ Pending"}
                        </span>

                      </div>

                    </div>

                  </div>

                )
              }
            )}

          </div>

        </section>

      )}

    </div>
  )
}