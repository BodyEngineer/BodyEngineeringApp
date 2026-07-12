export default function ProgressHeader({
    title,
    subtitle,
    step,
    totalSteps,
  }) {
    const progress = (step / totalSteps) * 100;
  
    return (
      <div className="progress-header">
  
        <h1>{title}</h1>
  
        <p>{subtitle}</p>
  
        <div className="progress-info">
  
          <span>
            Step {step} of {totalSteps}
          </span>
  
          <span>
            {Math.round(progress)}%
          </span>
  
        </div>
  
        <div className="progress-bar">
  
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
  
        </div>
  
      </div>
    );
  }