export default function SectionCard({
    title,
    subtitle,
    children,
  }) {
    return (
      <div className="section-card">
  
        <div className="section-card-header">
  
          <h2>{title}</h2>
  
          {subtitle && (
            <p>{subtitle}</p>
          )}
  
        </div>
  
        <div className="section-card-body">
  
          {children}
  
        </div>
  
      </div>
    );
  }