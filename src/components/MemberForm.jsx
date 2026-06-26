import { useEffect, useState } from 'react'
import Input from './Input'
import Select from './Select'
import Button from './Button'
import { MEMBERSHIP_TYPES, calculateMembershipEnd } from '../lib/members'

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  membership_type: 'monthly',
  membership_start: new Date().toISOString().split('T')[0],
  membership_end: '',
  notes: ''
}

export default function MemberForm({ member, onSubmit, loading, submitLabel = 'Save Member' }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        password: '',
        membership_type: member.membership_type || 'monthly',
        membership_start: member.membership_start || initialForm.membership_start,
        membership_end: member.membership_end || '',
        notes: member.notes || '',
      })
    }
  }, [member])

  useEffect(() => {
    if (form.membership_start && form.membership_type) {
      const end = calculateMembershipEnd(form.membership_start, form.membership_type)
      setForm((prev) => ({ ...prev, membership_end: end }))
    }
  }, [form.membership_start, form.membership_type])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.full_name.trim()) newErrors.full_name = 'Full name is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!form.email.trim())
      newErrors.email = 'Email is required'
    
    if (!form.password.trim() && !member)
      newErrors.password = 'Password is required'
    if (!form.membership_start) newErrors.membership_start = 'Start date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert("Member Form Submit")
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          label="Full Name *"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          error={errors.full_name}
          placeholder="Enter member name"
        />
        <Input
          label="Phone *"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="+91 98765 43210"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="member@email.com"
        />
        <Input
  label="Password *"
  name="password"
  type="password"
  value={form.password}
  onChange={handleChange}
  error={errors.password}
  placeholder="Create password"
/>
        <Select
          label="Membership Plan"
          name="membership_type"
          value={form.membership_type}
          onChange={handleChange}
          options={MEMBERSHIP_TYPES}
        />
        <Input
          label="Start Date *"
          name="membership_start"
          type="date"
          value={form.membership_start}
          onChange={handleChange}
          error={errors.membership_start}
        />
        <Input
          label="Expiry Date"
          name="membership_end"
          type="date"
          value={form.membership_end}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes" className="form-label">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          className="form-textarea"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="form-actions">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
