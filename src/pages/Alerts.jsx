import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import Header from '../components/Header'
import AlertList from '../components/AlertList'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import CashRenewalModal from '../components/CashRenewalModal'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getRenewalAlerts } from '../lib/members'

export default function Alerts() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renewTarget, setRenewTarget] = useState(null)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMembers()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchMembers = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // 1. FETCH GYM MEMBERS
      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from('members')
        .select('*')
        .eq('owner_id', user.id)
        .order('membership_end')

      if (memberError) throw memberError

      const memberAlerts = getRenewalAlerts(memberData || [])

      // 2. FETCH ONLINE CLIENTS
      const {
        data: onlineData,
        error: onlineError,
      } = await supabase
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

      // 3. COMBINE GYM AND ONLINE ALERTS
      const combinedAlerts = [
        ...memberAlerts.map((alert) => ({
          ...alert,
          alertType: 'gym',
        })),
        ...onlineAlerts,
      ]

      // EXPIRED FIRST, THEN EXPIRING SOON
      combinedAlerts.sort((a, b) => {
        if (
          a.status === 'expired' &&
          b.status !== 'expired'
        ) {
          return -1
        }

        if (
          a.status !== 'expired' &&
          b.status === 'expired'
        ) {
          return 1
        }

        return a.daysUntilExpiry - b.daysUntilExpiry
      })

      setAlerts(combinedAlerts)
    } catch (error) {
      console.error('Renewal alerts error:', error)

      setError(
        error.message || 'Failed to load renewal alerts.'
      )
    } finally {
      setLoading(false)
    }
  }

  // CASH RENEWAL FOR GYM MEMBERS
  const handleCashRenewal = async ({
    renewalPeriod,
    renewalAmount,
  }) => {
    if (!renewTarget || !user || renewing) return

    // Prevent online clients from using the gym renewal handler.
    if (renewTarget.alertType === 'online') {
      setError(
        'Online clients must be renewed through Online Clients.'
      )
      return
    }

    const monthsMap = {
      monthly: 1,
      quarterly: 3,
      'half-yearly': 6,
      yearly: 12,
    }

    const monthsToAdd = monthsMap[renewalPeriod]

    if (!monthsToAdd) {
      setError('Invalid renewal period selected.')
      return
    }

    if (
      renewalAmount == null ||
      !Number.isFinite(Number(renewalAmount)) ||
      Number(renewalAmount) <= 0
    ) {
      setError('Please enter a valid payment amount.')
      return
    }

    setRenewing(true)
    setError('')

    try {
      // Calculate the new expiry date.
      const today = new Date()

      const currentExpiry = renewTarget.membership_end
        ? new Date(renewTarget.membership_end)
        : null

      const baseDate =
        currentExpiry &&
        !Number.isNaN(currentExpiry.getTime()) &&
        currentExpiry > today
          ? currentExpiry
          : today

      const newExpiry = new Date(baseDate)

      newExpiry.setMonth(
        newExpiry.getMonth() + monthsToAdd
      )

      const newExpiryDate =
        `${newExpiry.getFullYear()}-` +
        `${String(newExpiry.getMonth() + 1).padStart(2, '0')}-` +
        `${String(newExpiry.getDate()).padStart(2, '0')}`

      // 1. UPDATE GYM MEMBERSHIP
      const { data: updatedMember, error: memberError } =
        await supabase
          .from('members')
          .update({
            membership_end: newExpiryDate,
            membership_type: renewalPeriod,
          })
          .eq('id', renewTarget.id)
          .eq('owner_id', user.id)
          .select()
          .maybeSingle()

      if (memberError) throw memberError

      if (!updatedMember) {
        throw new Error(
          'Member was not updated. Check the member record and access permissions.'
        )
      }

      // 2. RECORD APPROVED CASH PAYMENT
      const { error: paymentError } = await supabase
        .from('payment_requests')
        .insert({
          member_id: renewTarget.id,
          amount: Number(renewalAmount),
          renewal_period: renewalPeriod,
          payment_method: 'cash',
          payment_date: new Date()
            .toISOString()
            .split('T')[0],
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })

      if (paymentError) throw paymentError

      // 3. CLOSE MODAL AND REFRESH ALERTS
      setRenewTarget(null)

      await fetchMembers()
    } catch (error) {
      console.error('Alert cash renewal error:', error)

      setError(
        error.message ||
          'Something went wrong while recording the renewal.'
      )
    } finally {
      setRenewing(false)
    }
  }

  const expiredCount = alerts.filter(
    (alert) => alert.status === 'expired'
  ).length

  const expiringCount = alerts.filter(
    (alert) => alert.status === 'expiring'
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
        <AlertList
          alerts={alerts}
          onRenew={(alert) => {
            setError('')
            setRenewTarget(alert)
          }}
          showRenew={true}
        />
      ) : (
        <EmptyState
          title="All memberships are current"
          description="No renewals are due at this time. Check back later."
        />
      )}

      <CashRenewalModal
        member={renewTarget}
        isOpen={!!renewTarget}
        loading={renewing}
        onClose={() => {
          if (!renewing) {
            setRenewTarget(null)
          }
        }}
        onConfirm={handleCashRenewal}
      />
    </div>
  )
}