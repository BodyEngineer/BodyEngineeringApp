export default function DashboardCard({ title, value, icon: Icon, trend, variant = 'default' }) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-content">
        <span className="stat-card-label">{title}</span>
        <span className="stat-card-value">{value}</span>
        {trend && <span className="stat-card-trend">{trend}</span>}
      </div>
      {Icon && (
        <div className="stat-card-icon">
          <Icon size={24} strokeWidth={2} />
        </div>
      )}
    </div>
  )
}
