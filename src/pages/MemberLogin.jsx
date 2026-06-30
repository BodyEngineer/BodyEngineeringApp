import { useState } from 'react'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
  
    setSubmitting(true)
    setError('')
  
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
  
    if (error) {
      setError(error.message)
    } else {
    
      const {
        data: { user }
      } = await supabase.auth.getUser();
    
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
    
      if (!member) {
    
        await supabase.auth.signOut();
    
        setError("Access denied. This account is not a member.");
    
        return;
      }
    
      window.location.href = "/member-dashboard";
    }
  
    setSubmitting(false)
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Logo size="lg" showTagline />
            <p className="login-subtitle">Member Portal - Access your membership</p>
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

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

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