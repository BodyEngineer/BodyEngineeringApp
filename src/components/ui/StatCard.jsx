export default function StatCard({
    icon,
    title,
    value,
    unit,
  }) {
    return (
      <div className="stat-card">
  
        <div className="stat-icon">
          {icon}
        </div>
  
        <div className="stat-content">
  
          <p className="stat-title">
            {title}
          </p>
  
          <h2 className="stat-value">
            {value}
            {unit && (
              <span className="stat-unit">
                {" "}{unit}
              </span>
            )}
          </h2>
  
        </div>
  
      </div>
    );
  }