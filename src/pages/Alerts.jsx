import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Header from '../components/Header'
import AlertList from '../components/AlertList'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getRenewalAlerts } from '../lib/members'

export default function Alerts() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [user])

  const fetchMembers = async () => {
    if (!user) return
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('owner_id', user.id)
      .order('membership_end')

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAlerts(getRenewalAlerts(data || []))
    }
    setLoading(false)
  }

  const expiredCount = alerts.filter((a) => a.status === 'expired').length
  const expiringCount = alerts.filter((a) => a.status === 'expiring').length

  return (
    <div className="page">
      <Header
        title="Renewal Alerts"
        subtitle="Members requiring membership renewal"
        onMenuClick={openSidebar}
      />

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && alerts.length > 0 && (
        <div className="alert-summary">
          <div className="alert-summary-item alert-summary-danger">
            <span className="alert-summary-count">{expiredCount}</span>
            <span>Expired</span>
          </div>
          <div className="alert-summary-item alert-summary-warning">
            <span className="alert-summary-count">{expiringCount}</span>
            <span>Expiring Soon</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loading">
          <LoadingSpinner size="lg" />
        </div>
      ) : alerts.length > 0 ? (
        <AlertList alerts={alerts} />
      ) : (
        <EmptyState
          title="All memberships are current"
          description="No renewals are due at this time. Check back later."
        />
      )}
    </div>
  )
}
