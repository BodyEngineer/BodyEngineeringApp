import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Header from '../components/Header'
import MemberForm from '../components/MemberForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function EditMember() {
  const { id } = useParams()
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMember()
  }, [id, user])

  const fetchMember = async () => {
    if (!user || !id) return

    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setMember(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (form) => {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('members')
      .update({
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        membership_type: form.membership_type,
        membership_start: form.membership_start,
        membership_end: form.membership_end,
        notes: form.notes.trim() || null,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      navigate(`/members/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!member && !loading) {
    return (
      <div className="page">
        <Header title="Member Not Found" onMenuClick={openSidebar} />
        <div className="alert alert-error">This member could not be found.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <Header
        title="Edit Member"
        subtitle={member?.full_name}
        onMenuClick={openSidebar}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-card">
        <MemberForm
          member={member}
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  )
}
