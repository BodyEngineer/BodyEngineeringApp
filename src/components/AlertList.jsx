import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDate } from '../lib/members'

export default function AlertList({ alerts }) {
  if (!alerts.length) return null

  return (
    <div className="alert-list">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert-item alert-item-${alert.status}`}>
          <div className="alert-item-icon">
            {alert.status === 'expired' ? (
              <AlertTriangle size={20} />
            ) : (
              <Clock size={20} />
            )}
          </div>
          <div className="alert-item-content">
            <div className="alert-item-header">
              <span className="alert-item-name">{alert.full_name}</span>
              <StatusBadge status={alert.status} />
            </div>
            <p className="alert-item-meta">
              {alert.phone} · {alert.membership_type} plan · Expires {formatDate(alert.membership_end)}
            </p>
            <p className="alert-item-message">
              {alert.daysUntilExpiry < 0
                ? `Expired ${Math.abs(alert.daysUntilExpiry)} day${Math.abs(alert.daysUntilExpiry) !== 1 ? 's' : ''} ago`
                : alert.daysUntilExpiry === 0
                  ? 'Expires today — renewal needed'
                  : `Expires in ${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link to={`/members/${alert.id}/edit`} className="alert-item-action">
            <RefreshCw size={16} />
            Renew
          </Link>
        </div>
      ))}
    </div>
  )
}
