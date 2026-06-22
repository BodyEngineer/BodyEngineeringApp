export default function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`form-input ${error ? 'form-input-error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
