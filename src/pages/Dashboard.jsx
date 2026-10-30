import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Users, UserCheck, Clock, RefreshCw, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import DashboardCard from '../components/DashboardCard'
import AlertList from '../components/AlertList'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { computeDashboardStats, getRenewalAlerts } from '../lib/members'
import CashRenewalModal from '../components/CashRenewalModal'

export default function Dashboard() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [onlineClients, setOnlineClients] = useState([])
  const [paymentRequests, setPaymentRequests] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
const [selectedPayment, setSelectedPayment] = useState(null)
 const [paymentImageUrl, setPaymentImageUrl] = useState("")
 const [renewalPeriod, setRenewalPeriod] = useState("monthly")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renewTarget, setRenewTarget] = useState(null)
const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [user])

  useEffect(() => {
    const loadPaymentImage = async () => {
      if (!selectedPayment?.screenshot_url) {
        setPaymentImageUrl("")
        return
      }

      console.log("Selected payment screenshot path:", selectedPayment.screenshot_url)
console.log("Online client ID:", selectedPayment.online_client_id)
console.log("Gym member ID:", selectedPayment.member_id)

      const { data, error } = await supabase.storage
        .from("payment-media")
        .createSignedUrl(selectedPayment.screenshot_url, 300)

      if (error) {
        console.error("Payment image error:", error)
        setPaymentImageUrl("")
        return
      }

      setPaymentImageUrl(data?.signedUrl || "")
    }

    loadPaymentImage()
  }, [selectedPayment])

  const approvePayment = async () => {
    if (!selectedPayment?.id) return

    try {
      setError('')

      const monthsMap = {
        monthly: 1,
        quarterly: 3,
        'half-yearly': 6,
        yearly: 12,
      }

      const monthsToAdd = monthsMap[renewalPeriod]

      if (!monthsToAdd) {
        throw new Error('Invalid renewal period selected.')
      }

      const today = new Date()

     // --------------------------------------------------
// 2. ONLINE CLIENT PAYMENT
// --------------------------------------------------

if (selectedPayment.online_client_id) {
  const onlineClient = onlineClients.find(
    (client) =>
      client.id === selectedPayment.online_client_id
  )

  if (!onlineClient) {
    throw new Error('Online client could not be found.')
  }

  const currentExpiry = onlineClient.expiry_date
    ? new Date(onlineClient.expiry_date)
    : null

  // IMPORTANT:
  // Always renew from the existing expiry date.
  // Only use today when there is no previous expiry.
  const baseDate = currentExpiry || today

  const newExpiry = new Date(baseDate)

  newExpiry.setMonth(
    newExpiry.getMonth() + monthsToAdd
  )

  const newExpiryDate =
    `${newExpiry.getFullYear()}-` +
    `${String(newExpiry.getMonth() + 1).padStart(2, '0')}-` +
    `${String(newExpiry.getDate()).padStart(2, '0')}`

  console.log('ONLINE CLIENT RENEWAL')
  console.log('Old expiry:', onlineClient.expiry_date)
  console.log('Base date:', baseDate)
  console.log('Months:', monthsToAdd)
  console.log('New expiry:', newExpiryDate)

  const {
    data: updatedOnlineClient,
    error: onlineClientError
  } = await supabase
    .from('online_clients')
    .update({
      expiry_date: newExpiryDate,
      // REMOVE THIS LINE if your table does not have status
      // status: 'active',
    })
    .eq('id', onlineClient.id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (onlineClientError) {
    console.error(
      'ONLINE CLIENT UPDATE ERROR:',
      onlineClientError
    )

    throw onlineClientError
  }

  console.log(
    'ONLINE CLIENT UPDATED SUCCESSFULLY:',
    updatedOnlineClient
  )
}


      // ==================================================
      // 2. GYM MEMBER PAYMENT
      // ==================================================

      if (selectedPayment.member_id) {

        const member = members.find(
          (m) =>
            String(m.id) ===
            String(selectedPayment.member_id)
        )

        if (!member) {
          throw new Error(
            `Gym member not found. Member ID: ${selectedPayment.member_id}`
          )
        }

        const currentExpiry = member.membership_end
          ? new Date(member.membership_end)
          : null

        const baseDate =
          currentExpiry || today


        const newExpiry = new Date(baseDate)

        newExpiry.setMonth(
          newExpiry.getMonth() + monthsToAdd
        )

        const newExpiryDate =
          newExpiry.toISOString().split('T')[0]

        const {
          data: updatedMember,
          error: memberError,
        } = await supabase
          .from('members')
          .update({
            membership_end: newExpiryDate,
            membership_type: renewalPeriod,
          })
          .eq('id', member.id)
          .eq('owner_id', user.id)
          .select()
          .maybeSingle()

        if (memberError) {
          console.error(
            'MEMBER UPDATE ERROR:',
            memberError
          )

          throw memberError
        }

        if (!updatedMember) {
          throw new Error(
            'Member was not updated. Check the members RLS policy.'
          )
        }
      }

      // ==================================================
      // 3. APPROVE PAYMENT REQUEST
      // ==================================================

      console.log(
        'APPROVING PAYMENT REQUEST:',
        selectedPayment.id
      )

      const {
        data: approvedPayment,
        error: paymentError,
      } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id)
        .eq('status', 'pending')
        .select()
        .maybeSingle()

      if (paymentError) {
        console.error(
          'PAYMENT APPROVAL ERROR:',
          paymentError
        )

        throw paymentError
      }

      if (!approvedPayment) {
        throw new Error(
          'Payment was not approved. It may already have been processed or the update is blocked by RLS.'
        )
      }

      console.log(
        'PAYMENT APPROVED SUCCESSFULLY:',
        approvedPayment
      )

      // ==================================================
      // 4. CLOSE MODAL
      // ==================================================

      setSelectedPayment(null)
      setPaymentImageUrl('')
      setRenewalPeriod('monthly')

      // ==================================================
      // 5. REFRESH DASHBOARD
      // ==================================================

      await fetchMembers()

    } catch (error) {

      console.error(
        '================================='
      )

      console.error(
        'APPROVE PAYMENT FAILED:',
        error
      )

      console.error(
        '================================='
      )

      setError(
        error?.message ||
        'Something went wrong while approving the payment.'
      )
    }
  }


  const rejectPayment = async () => {
    if (!selectedPayment) return

    try {
      setError('')

      const { data: rejectedPayment, error } = await supabase
  .from('payment_requests')
  .update({
    status: 'rejected',
  })
  .eq('id', selectedPayment.id)
  .eq('status', 'pending')
  .select()
  .maybeSingle()

if (error) throw error

if (!rejectedPayment) {
  throw new Error(
    'This payment has already been processed or is no longer pending.'
  )
}

      if (error) throw error

      setSelectedPayment(null)
      setPaymentImageUrl('')
      await fetchMembers()

    } catch (error) {
      console.error('Reject payment error:', error)
      setError(error.message)
    }
  }

  const fetchMembers = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // ==================================================
      // 1. FETCH GYM MEMBERS
      // ==================================================

      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from('members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (memberError) {
        throw memberError
      }

      // ==================================================
      // 2. FETCH ONLINE CLIENTS
      // ==================================================

      const {
        data: onlineData,
        error: onlineError,
      } = await supabase
        .from('online_clients')
        .select('*')
        .eq('owner_id', user.id)

      if (onlineError) {
        throw onlineError
      }

      // ==================================================
      // 3. FETCH PENDING PAYMENTS
      // ==================================================

      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (paymentError) {
        console.error('Pending payment error:', paymentError)
      } else {
        const enrichedPayments = (paymentData || []).map((payment) => {
          const gymMember = payment.member_id
            ? (memberData || []).find(
                (m) => m.id === payment.member_id
              )
            : null

          const onlineClient = payment.online_client_id
            ? (onlineData || []).find(
                (c) => c.id === payment.online_client_id
              )
            : null

          return {
            ...payment,
            member_name:
              gymMember?.full_name ||
              onlineClient?.full_name ||
              'Unknown Member',
          }
        })

        setPaymentRequests(enrichedPayments)
      }

      // ==================================================
      // 4. FETCH APPROVED PAYMENT HISTORY
      // ==================================================

      const {
        data: approvedPayments,
        error: historyError,
      } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (historyError) {
        console.error(
          'Payment history error:',
          historyError
        )

        setPaymentHistory([])
      } else {
        console.log(
          'APPROVED PAYMENT HISTORY:',
          approvedPayments
        )

        setPaymentHistory(approvedPayments || [])
      }

      // ==================================================
      // 5. UPDATE DASHBOARD DATA
      // ==================================================

      setMembers(memberData || [])
      setOnlineClients(onlineData || [])

    } catch (error) {
      console.error(
        'Dashboard fetch error:',
        error
      )

      setError(
        error?.message ||
        'Failed to load dashboard data.'
      )
    } finally {
      setLoading(false)
    }
  }

  const stats = computeDashboardStats(members)
const alerts = getRenewalAlerts(members).slice(0, 5)

const now = new Date()

const monthlyRevenue = paymentHistory
  .filter((payment) => {
    if (payment.status !== "approved") {
      return false
    }

    const paymentDate = new Date(
      payment.payment_date || payment.approved_at || payment.created_at
    )

    return (
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getFullYear() === now.getFullYear()
    )
  })
  .reduce((total, payment) => {
    return total + Number(payment.amount || 0)
  }, 0)

const totalRevenue = paymentHistory
  .filter(
    (payment) =>
      payment.status === "approved"
  )
  .reduce((total, payment) => {
    return total + Number(payment.amount || 0)
  }, 0)

  const todayRevenue = paymentHistory
  .filter((payment) => {
    if (payment.status !== "approved") {
      return false
    }

    const paymentDate = new Date(
      payment.payment_date || payment.approved_at || payment.created_at
    )

    return (
      paymentDate.getDate() === now.getDate() &&
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getFullYear() === now.getFullYear()
    )
  })
  .reduce((total, payment) => {
    return total + Number(payment.amount || 0)
  }, 0)

  const getRenewalPreview = () => {
    if (!selectedPayment) {
      return null
    }

    const today = new Date()
    let expiryValue = null

    // Gym member expiry
    if (selectedPayment.member_id) {
      const member = members.find(
        (m) => m.id === selectedPayment.member_id
      )

      expiryValue = member?.membership_end || null
    }

    // Online client expiry
    if (selectedPayment.online_client_id) {
      const onlineClient = onlineClients.find(
        (client) => client.id === selectedPayment.online_client_id
      )

      expiryValue = onlineClient?.expiry_date || null
    }

    const currentExpiry = expiryValue
      ? new Date(expiryValue)
      : null

    const baseDate =
      currentExpiry && currentExpiry > today
        ? currentExpiry
        : today

    const newExpiry = new Date(baseDate)

    const monthsMap = {
      monthly: 1,
      quarterly: 3,
      'half-yearly': 6,
      yearly: 12,
    }

    const monthsToAdd = monthsMap[renewalPeriod]

    if (monthsToAdd === 12) {
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)
    } else if (monthsToAdd) {
      newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd)
    }

    return {
      current: currentExpiry
        ? currentExpiry.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Expired',

      newExpiry: newExpiry.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }
  }

  const renewalPreview = getRenewalPreview()

  return (
    <div className="page">
      <Header
        title="Owner Dashboard"
        subtitle="Overview of your gym operations"
        onMenuClick={openSidebar}
        action={
          <Link to="/members/add">
            <Button>Add Member</Button>
          </Link>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <DashboardCard
              title="Total Members"
              value={stats.totalMembers}
              icon={Users}
              variant="default"
            />
            <DashboardCard
  title="Online Clients"
  value={onlineClients.length}
  icon={Users}
  variant="default"
/>
            <DashboardCard
              title="Active Members"
              value={stats.activeMembers}
              icon={UserCheck}
              variant="success"
            />
            <DashboardCard
              title="Expiring This Week"
              value={stats.expiringThisWeek}
              icon={Clock}
              variant="warning"
            />
            <DashboardCard
              title="Renewals Due"
              value={stats.renewalsDue}
              icon={RefreshCw}
              variant="danger"
            />
     <DashboardCard
  title="Monthly Revenue"
 value={`₹${monthlyRevenue.toLocaleString("en-IN")}`}
  icon={RefreshCw}
  variant="success"
/>

<DashboardCard
  title="Pending Payments"
  value={paymentRequests.length}
  icon={Clock}
  variant="warning"
/>

          </div>

          <section className="dashboard-section">
  <div className="section-header">
    <h2 className="section-title">
      💰 Revenue Overview
    </h2>
  </div>

  <div className="stats-grid">

    <DashboardCard
      title="Today's Revenue"
      value={`₹${todayRevenue.toLocaleString("en-IN")}`}
      icon={RefreshCw}
      variant="success"
    />

    <DashboardCard
      title="This Month"
      value={`₹${monthlyRevenue.toLocaleString("en-IN")}`}
      icon={RefreshCw}
      variant="success"
    />

    <DashboardCard
      title="Total Revenue"
      value={`₹${totalRevenue.toLocaleString("en-IN")}`}
      icon={RefreshCw}
      variant="success"
    />

  </div>
</section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Renewal Alerts</h2>
              {alerts.length > 0 && (
                <Link to="/alerts" className="section-link">
                  View all <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {alerts.length > 0 ? (
             <AlertList
             alerts={alerts}
             showRenew={false}
           />
            ) : (
              <EmptyState
                title="No renewal alerts"
                description="All memberships are up to date. Great work!"
              />
            )}
          </section>

          <section className="dashboard-section">

  <div className="section-header">
    <h2 className="section-title">
      💳 Payment Verification
    </h2>
  </div>

  {paymentRequests.length === 0 ? (
    <EmptyState
      title="No pending payments"
      description="All payment requests have been processed."
    />
  ) : (
    <div className="payment-request-list">

      {paymentRequests.map((payment) => (

        <div
          key={payment.id}
          className="payment-request-card"
        >

          <div>
            <h3>
              {payment.member_name}
            </h3>

            <p>
  Amount: ₹{payment.amount}
</p>

<p>
  Renewal:{" "}
  {payment.renewal_period
    ? payment.renewal_period
        .replace("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Not specified"}
</p>

<p>
  Submitted:{" "}
  {new Date(
    payment.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}
</p>

            <span className="status-warning">
              ⏳ Pending Verification
            </span>
          </div>

          <div>
          <Button
  onClick={() => {
    setRenewalPeriod(payment.renewal_period || "monthly")
    setSelectedPayment(payment)
  }}
>
  Review Payment →
</Button>
          </div>

        </div>

      ))}

    </div>
  )}

</section>
        </>
      )}
  {selectedPayment && (
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
        >
          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#111",
              border: "1px solid #ff4438",
              borderRadius: "20px",
              padding: "28px",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>💳 Payment Review</h2>

              <button
                onClick={() => {
                  setSelectedPayment(null)
setPaymentImageUrl("")
setRenewalPeriod("monthly")
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#1b1b1b",
                borderRadius: "14px",
                padding: "18px",
                marginBottom: "20px",
              }}
            >
             <h3>
  {selectedPayment.member_id
    ? members.find(
        (m) => m.id === selectedPayment.member_id
      )?.full_name || "Member"
    : onlineClients.find(
        (c) =>
          c.id === selectedPayment.online_client_id
      )?.full_name || "Online Client"}
</h3>

              <p>
                <strong>Amount:</strong>{" "}
                ₹{selectedPayment.amount}
              </p>

              <p>
                <strong>Plan:</strong>{" "}
                {selectedPayment.members?.membership_type || "—"}
              </p>

              <p>
  <strong>Requested Renewal:</strong>{" "}
  {selectedPayment.renewal_period
    ? selectedPayment.renewal_period
        .replace("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Not specified"}
</p>

              <p>
                <strong>Phone:</strong>{" "}
                {selectedPayment.member_id
  ? members.find(
      (m) => m.id === selectedPayment.member_id
    )?.phone || "—"
  : onlineClients.find(
      (c) =>
        c.id === selectedPayment.online_client_id
    )?.phone || "—"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                ⏳ Pending Verification
              </p>
            </div>

            <div
  style={{
    marginTop: "20px",
    padding: "16px",
    borderRadius: "12px",
    background: "#1b1b1b",
  }}
>
  <label
    style={{
      display: "block",
      marginBottom: "10px",
      fontWeight: "700",
    }}
  >
    🔄 Renewal Period
  </label>

  <select
    value={renewalPeriod}
    onChange={(e) => setRenewalPeriod(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #444",
      background: "#111",
      color: "#fff",
      fontSize: "15px",
    }}
  >
    <option value="monthly">Monthly — 1 Month</option>
    <option value="quarterly">Quarterly — 3 Months</option>
    <option value="half-yearly">Half-Yearly — 6 Months</option>
    <option value="yearly">Yearly — 12 Months</option>
  </select>
</div>

{renewalPreview && (
  <div
    style={{
      marginBottom: "20px",
      padding: "16px",
      borderRadius: "12px",
      background: "#171717",
      border: "1px solid #333",
    }}
  >
    <div
      style={{
        fontWeight: "700",
        marginBottom: "12px",
      }}
    >
      📅 Renewal Preview
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
          Current Expiry
        </div>

        <div style={{ fontWeight: "700", marginTop: "4px" }}>
          {renewalPreview.current}
        </div>
      </div>

      <div style={{ fontSize: "22px", opacity: 0.7 }}>
        →
      </div>

      <div>
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
          New Expiry
        </div>

        <div
          style={{
            fontWeight: "700",
            marginTop: "4px",
            color: "#22c55e",
          }}
        >
          {renewalPreview.newExpiry}
        </div>
      </div>
    </div>
  </div>
)}

            <h3 style={{ marginBottom: "12px" }}>
              Payment Screenshot
            </h3>

            {paymentImageUrl ? (
              <img
                src={paymentImageUrl}
                alt="Payment proof"
                style={{
                  width: "100%",
                  maxHeight: "500px",
                  objectFit: "contain",
                  background: "#000",
                  borderRadius: "14px",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  background: "#1b1b1b",
                  borderRadius: "14px",
                }}
              >
                Loading payment screenshot...
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={approvePayment}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#22c55e',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ✅ Approve Payment
              </button>

              <button
                onClick={rejectPayment}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #ef4444',
                  background: 'transparent',
                  color: '#ef4444',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ❌ Reject Payment
              </button>
            </div>

            </div>
            </div>
      )}

    </div>
  )
}
