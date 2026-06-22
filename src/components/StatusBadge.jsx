export default function StatusBadge({ status }) {
  const labels = {
    active: 'Active',
    expiring: 'Expiring Soon',
    expired: 'Expired',
  }

  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>
}
