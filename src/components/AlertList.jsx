import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDate } from '../lib/members'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AlertList({ alerts, onRenew, showRenew = true }) {
  const [settings, setSettings] = useState({
    whatsapp_number: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase
      .from('website_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) {
      setSettings(data)
    }
  }

  return (
    <div className="alert-list">
      {alerts.map((alert) => {
        const isOnline = alert.alertType === 'online'

        return (
          <div
          key={`${alert.alertType}-${alert.id}`}
            className={`alert-item alert-item-${alert.status}`}
          >
            <div className="alert-item-icon">
              {alert.status === 'expired' ? (
                <AlertTriangle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>

            <div className="alert-item-content">
              <div className="alert-item-header">
                <span className="alert-item-name">
                  {alert.full_name}
                </span>

                <StatusBadge status={alert.status} />
              </div>

              {/* Client Type */}
              <p
                className="alert-item-meta"
                style={{
                  fontWeight: '600',
                  marginBottom: '6px',
                }}
              >
                {isOnline
                  ? '💻 Online Client'
                  : '🏋️ Gym Member'}
              </p>

              <p className="alert-item-meta">
  {alert.alertType === "online" ? "🌍 Online Coaching" : "🏋️ Gym Membership"}
  {" · "}
  {alert.phone}
  {" · "}
  {alert.membership_type || "Membership"} plan
  {" · "}
  Expires {formatDate(alert.membership_end)}
</p>

              <p className="alert-item-message">
                {alert.daysUntilExpiry < 0
                  ? `Expired ${Math.abs(
                      alert.daysUntilExpiry
                    )} day${
                      Math.abs(alert.daysUntilExpiry) !== 1
                        ? 's'
                        : ''
                    } ago`
                  : alert.daysUntilExpiry === 0
                    ? 'Expires today — renewal needed'
                    : `Expires in ${
                        alert.daysUntilExpiry
                      } day${
                        alert.daysUntilExpiry !== 1
                          ? 's'
                          : ''
                      }`}
              </p>
            </div>

            <div className="alert-actions">

              {/* =========================
                  WHATSAPP REMINDER
              ========================= */}
              <button
                className="whatsapp-reminder-btn"
                onClick={() => {
                  if (!alert.phone) {
                    alert(
                      'This client does not have a phone number.'
                    )
                    return
                  }

                  const phone = String(alert.phone).replace(
                    /\D/g,
                    ''
                  )

                  const whatsappNumber =
                    phone.length === 10
                      ? `91${phone}`
                      : phone

                  const message = isOnline
                    ? `Hi ${alert.full_name},

💻 Body Engineering Online Coaching Reminder

Your online coaching membership is ${
                        alert.status === 'expired'
                          ? 'expired'
                          : 'due for renewal'
                      }.

Membership Plan: ${alert.membership_type}
Expiry Date: ${formatDate(alert.membership_end)}

Please renew your coaching membership to continue your transformation without interruption.

For renewal assistance, simply reply to this message.

Team Body Engineering 💪
📞 ${settings.whatsapp_number}`
                    : `Hi ${alert.full_name},

{alert.alertType === "online"
  ? "🌍 Body Engineering Online Coaching Reminder"
  : "🏋️ Body Engineering Membership Reminder"}

Membership Plan: ${alert.membership_type}
Expiry Date: ${formatDate(alert.membership_end)}

${
  alert.status === 'expired'
    ? 'Your membership has expired.'
    : 'Your membership is due for renewal.'
}

Renew today and continue your fitness transformation with us.

For renewal assistance, simply reply to this message.

Team Body Engineering 💪
📞 ${settings.whatsapp_number}`

                  window.open(
                    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      message
                    )}`,
                    '_blank'
                  )
                }}
              >
                📱 WhatsApp Reminder
              </button>

  {/* =========================
    RENEW
========================= */}
{showRenew && (
  alert.alertType === "online" ? (
    <Link
      to={`/online-clients?renew=${alert.id}`}
      className="alert-item-action"
    >
      <RefreshCw size={16} />
      Renew
    </Link>
  ) : (
    <button
      type="button"
      className="alert-item-action"
      onClick={() => onRenew(alert)}
    >
      <RefreshCw size={16} />
      Renew
    </button>
  )
)}


            </div>
          </div>
        )
      })}
    </div>
  )
}