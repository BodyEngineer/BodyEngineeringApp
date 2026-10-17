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
    setError('')
  
    try {
      // =========================
      // GYM MEMBERS
      // =========================
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('owner_id', user.id)
        .order('membership_end')
  
      if (memberError) throw memberError
  
      const memberAlerts = getRenewalAlerts(memberData || [])
  
      // =========================
      // ONLINE CLIENTS
      // =========================
      const { data: onlineData, error: onlineError } = await supabase
        .from('online_clients')
        .select('*')
        .eq('owner_id', user.id)
        .order('expiry_date')
  
      if (onlineError) throw onlineError
  
      const today = new Date()
      today.setHours(0, 0, 0, 0)
  
      const onlineAlerts = (onlineData || [])
        .filter((client) => client.expiry_date)
        .map((client) => {
          const expiryDate = new Date(client.expiry_date)
          expiryDate.setHours(0, 0, 0, 0)
  
          const diffTime = expiryDate - today
          const daysUntilExpiry = Math.ceil(
            diffTime / (1000 * 60 * 60 * 24)
          )
  
          let status = 'current'
  
          if (daysUntilExpiry < 0) {
            status = 'expired'
          } else if (daysUntilExpiry <= 7) {
            status = 'expiring'
          }
  
          return {
            ...client,
  
            // Make online client compatible with AlertList
            alertType: 'online',
            id: client.id,
            full_name: client.full_name,
            phone: client.phone,
            membership_type: client.package_type,
            membership_end: client.expiry_date,
            daysUntilExpiry,
            status,
          }
        })
        .filter((alert) => alert.status !== 'current')
  
      // =========================
      // COMBINE BOTH
      // =========================
      const combinedAlerts = [
        ...memberAlerts.map((alert) => ({
          ...alert,
          alertType: 'gym',
        })),
        ...onlineAlerts,
      ]
  
      // Expired first, then expiring
      combinedAlerts.sort((a, b) => {
        if (a.status === 'expired' && b.status !== 'expired') return -1
        if (a.status !== 'expired' && b.status === 'expired') return 1
  
        return a.daysUntilExpiry - b.daysUntilExpiry
      })
  
      setAlerts(combinedAlerts)
    } catch (error) {
      console.error('Renewal alerts error:', error)
      setError(error.message || 'Failed to load renewal alerts.')
    } finally {
      setLoading(false)
    }
  }

  const expiredCount = alerts.filter(
    (a) => a.status === 'expired'
  ).length

  const expiringCount = alerts.filter(
    (a) => a.status === 'expiring'
  ).length

  return (
    <div className="page">
      <Header
        title="Renewal Alerts"
        subtitle="Gym members and online clients requiring renewal"
        onMenuClick={openSidebar}
      />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="alert-summary">
          <div className="alert-summary-item alert-summary-danger">
            <span className="alert-summary-count">
              {expiredCount}
            </span>
            <span>Expired</span>
          </div>

          <div className="alert-summary-item alert-summary-warning">
            <span className="alert-summary-count">
              {expiringCount}
            </span>
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