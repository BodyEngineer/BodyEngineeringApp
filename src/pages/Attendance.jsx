import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { LogIn, LogOut, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Header from '../components/Header'
import AttendanceTable from '../components/AttendanceTable'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import Select from '../components/Select'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { isActive } from '../lib/members'

export default function Attendance() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [records, setRecords] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    const [membersRes, attendanceRes] = await Promise.all([
      supabase
        .from('members')
        .select('*')
        .eq('owner_id', user.id)
        .order('full_name'),
      supabase
        .from('attendance')
        .select('*')
        .eq('owner_id', user.id)
        .order('check_in', { ascending: false })
        .limit(50),
    ])

    console.log("Logged in user:", user.id)
    console.log("Member:", membersRes.data)

    if (membersRes.error) {
      setError(membersRes.error.message)
    } else {
      setMembers(membersRes.data || [])
    }

    if (!attendanceRes.error) {
      setRecords(attendanceRes.data || [])
    }

    setLoading(false)
  }

  const activeMembers = members.filter((m) => isActive(m.membership_end))
  const membersMap = Object.fromEntries(members.map((m) => [m.id, m]))

  const memberOptions = [
    { value: '', label: 'Select a member...' },
    ...activeMembers.map((m) => ({ value: m.id, label: m.full_name })),
  ]

  const handleCheckIn = async () => {
    if (!selectedMember || !user) return
    setActionLoading(true)
    setError('')
    setSuccess('')

    const { error: insertError } = await supabase.from('attendance').insert({
      owner_id: user.id,
      member_id: selectedMember,
      check_in: new Date().toISOString(),
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Check-in recorded successfully')
      setSelectedMember('')
      fetchData()
    }
    setActionLoading(false)
  }

  if (existingSession) {
    const checkOutTime = new Date().toISOString();
  
    const { error: checkoutError } = await supabase
      .from("attendance")
      .update({
        check_out: checkOutTime,
      })
      .eq("id", existingSession.id);
  
    if (checkoutError) {
      throw checkoutError;
    }
  
    const checkInTime = new Date(existingSession.check_in);
    const checkOut = new Date(checkOutTime);
  
    const durationMinutes = Math.floor(
      (checkOut - checkInTime) / 60000
    );
  
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
  
    const durationText =
      hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;
  
    setMessage(
      `✅ Check-out successful! Gym duration: ${durationText}`
    );
  
    return;
  }
  return (
    <div className="page">
      <Header
        title="Attendance Tracking"
        subtitle="Record member check-ins and check-outs"
        onMenuClick={openSidebar}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="attendance-panel">
        <Select
          label="Select Member"
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          options={memberOptions}
        />
        <div className="attendance-actions">
          <Button
            onClick={handleCheckIn}
            loading={actionLoading}
            disabled={!selectedMember}
          >
            <LogIn size={18} />
            Check In
          </Button>
          <Button
            variant="secondary"
            onClick={handleCheckOut}
            loading={actionLoading}
            disabled={!selectedMember}
          >
            <LogOut size={18} />
            Check Out
          </Button>
        </div>

        <div className="attendance-qr-action">
  <Button
    variant="secondary"
    onClick={() => setShowQR(!showQR)}
  >
    <QrCode size={18} />
    {showQR ? 'Hide QR Code' : 'Show QR Code'}
  </Button>
</div>

{showQR && (
  <div className="attendance-qr-card">
    <h3>Gym Attendance QR</h3>

    <p>
      Members can scan this QR code to mark their attendance.
    </p>

    <QRCodeSVG
  value="https://body-engineering-app.vercel.app/member-attendance"
  size={280}
  level="M"
  includeMargin={true}
/>

    <p className="qr-owner-text">
      Body Engineering
    </p>
  </div>
)}
      </div>

      <section className="dashboard-section">
        <h2 className="section-title">Recent Attendance</h2>

        {loading ? (
          <div className="page-loading">
            <LoadingSpinner size="lg" />
          </div>
        ) : records.length > 0 ? (
          <AttendanceTable records={records} membersMap={membersMap} />
        ) : (
          <EmptyState
            title="No attendance records"
            description="Check in a member to start tracking attendance."
          />
        )}
      </section>
    </div>
  )
}
