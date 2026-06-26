import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import Header from '../components/Header'
import MemberForm from '../components/MemberForm'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AddMember() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (form) => {
    if (!user) {
      setError("Owner not logged in")
      return
    }
  
    setLoading(true)
    setError("")
  
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-member",
        {
          body: {
            owner_id: user.id,
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim(),
            membership_type: form.membership_type,
            membership_start: form.membership_start,
            membership_end: form.membership_end,
            notes: form.notes.trim(),
          },
        }
      )
  
      if (error) throw error
  
      navigate("/members")
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to create member")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Header
        title="Add New Member"
        subtitle="Register a new gym member"
        onMenuClick={openSidebar}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <MemberForm onSubmit={handleSubmit} loading={loading} submitLabel="Add Member" />
      </div>
    </div>
  )
}
