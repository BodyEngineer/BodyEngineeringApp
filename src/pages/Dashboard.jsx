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

export default function Dashboard() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [user])

  const fetchMembers = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setMembers(data || [])
    }
    setLoading(false)
  }

  const stats = computeDashboardStats(members)
  const alerts = getRenewalAlerts(members).slice(0, 5)

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
          </div>

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
              <AlertList alerts={alerts} />
            ) : (
              <EmptyState
                title="No renewal alerts"
                description="All memberships are up to date. Great work!"
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
