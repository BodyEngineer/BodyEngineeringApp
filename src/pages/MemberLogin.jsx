import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from "lucide-react";

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate();

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

    
      // Check Gym Member
const { data: member } = await supabase
.from("members")
.select("id")
.eq("auth_user_id", user.id)
.maybeSingle();

if (member) {
navigate("/member-dashboard", { replace: true });
return;
}

// Check Online Client
const { data: onlineClient, error: onlineError } = await supabase
  .from("online_clients")
  .select("id, auth_user_id")
  .eq("auth_user_id", user.id)
  .maybeSingle();


if (onlineClient) {
  navigate("/online-dashboard", { replace: true });
  return;
}

// Neither found
await supabase.auth.signOut();

setError("Access denied.");

return;
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
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "18px",
        color: "#ff4438"
      }}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>

  </div>

</div>

<p
  style={{
    textAlign: "right",
    marginTop: "10px",
    marginBottom: "15px",
    cursor: "pointer",
    color: "#ff5733",
  }}
  onClick={() =>
    navigate("/forgot-password")
  }
>
  Forgot Password?
</p>
    

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