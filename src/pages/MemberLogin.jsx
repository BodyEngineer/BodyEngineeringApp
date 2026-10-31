import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // Redirect an already logged-in member
  useEffect(() => {
    let active = true

    const checkExistingSession = async () => {
      if (authLoading) return

      if (!user) {
        if (active) setCheckingSession(false)
        return
      }

      try {
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (memberError) throw memberError

        if (member) {
          if (active) navigate('/member-dashboard', { replace: true })
          return
        }

        const { data: onlineClient, error: clientError } = await supabase
          .from('online_clients')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (clientError) throw clientError

        if (onlineClient) {
          if (active) navigate('/online-dashboard', { replace: true })
          return
        }

        if (active) setError('Your account does not have member access.')
      } catch (error) {
        console.error('Session check error:', error)
        if (active) setError('Unable to verify your account. Please try again.')
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    checkExistingSession()

    return () => {
      active = false
    }
  }, [user, authLoading, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()

    setSubmitting(true)
    setError('')

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      const userId = data.user?.id

      if (!userId) throw new Error('Unable to retrieve your account.')

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (memberError) throw memberError

      if (member) {
        navigate('/member-dashboard', { replace: true })
        return
      }

      const { data: onlineClient, error: onlineError } = await supabase
        .from('online_clients')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (onlineError) throw onlineError

      if (onlineClient) {
        navigate('/online-dashboard', { replace: true })
        return
      }

      await supabase.auth.signOut()
      throw new Error('Access denied.')
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || checkingSession) {
    return (
      <div className="loading-screen">
        <p>Checking your session...</p>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size="lg" showTagline />
            <p className="login-subtitle">
              Member Portal - Access your membership
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="alert alert-error">{error}</div>}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email-ID"
              required
              autoComplete="email"
            />

            <div className="form-group">
              <label className="form-label">Password</label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
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
                    position: 'absolute',
                    right: '12px',
                    top: '18px',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#ff4438',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p
              style={{
                textAlign: 'right',
                marginTop: '10px',
                marginBottom: '15px',
                cursor: 'pointer',
                color: '#ff5733',
              }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </p>

            <Button
              type="submit"
              loading={submitting}
              className="login-btn"
            >
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