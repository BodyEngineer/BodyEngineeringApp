import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { supabase } from '../../lib/supabase'

export default function OwnerForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setMessage(
        'Password reset link has been sent to your email address.'
      )
    } catch (err) {
      setError(
        err.message || 'Unable to send password reset email.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      <div className="login-container">
        <div className="login-card">

          <div className="login-header">
            <Logo size="lg" showTagline />

            <p className="login-subtitle">
              Reset Owner Password
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {message && (
              <div className="alert alert-success">
                {message}
              </div>
            )}

            <Input
              label="Owner Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bodyengineering.com"
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              loading={submitting}
              className="login-btn"
            >
              Send Reset Link
            </Button>

          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '20px'
            }}
          >
            <Link
              to="/login"
              style={{
                color: '#ff4438',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              ← Back to Owner Login
            </Link>
          </div>

          <p className="login-footer">
            Body Engineering · Premium Fitness Management
          </p>

        </div>
      </div>
    </div>
  )
}