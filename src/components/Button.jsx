export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      {...props}
    >
      {loading ? <span className="btn-loading">Processing...</span> : children}
    </button>
  )
}
