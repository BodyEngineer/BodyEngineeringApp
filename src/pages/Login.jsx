import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  if (loading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-container">
        <div className="login-card">
        <div className="portal-tabs">
  <button className="portal-tab active">
    Owner Portal
  </button>

  <a href="/member-login" className="portal-tab">
    Member Portal
  </a>
</div>
          <div className="login-header">
            <Logo size="lg" showTagline />
            <p className="login-subtitle">Manage Your Fitness Studio</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bodyengineering.com"
              required
              autoComplete="email"
            />

<div className="form-group">
  <label className="form-label">
    Password
  </label>

  <div style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      className="form-input"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
      autoComplete="current-password"
      required
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "12px",
        top: "18px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "#ff4438"
      }}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
</div>

<div
  style={{
    textAlign: "right",
    marginTop: "8px",
    marginBottom: "18px",
  }}
>
  <a
    href="/owner-forgot-password"
    style={{
      color: "#ff4438",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "600",
    }}
  >
    Forgot Password?
  </a>
</div>

            <Button type="submit" loading={submitting} className="login-btn">
              Sign In
            </Button>
   
          </form>

          <p className="login-footer">
            Body Engineering · Premium Fitness Management
          </p>
        </div>
      </div>
    </div>
  )
}
