import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Pencil, Phone, Mail, Calendar, FileText } from 'lucide-react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import AttendanceTable from '../components/AttendanceTable'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDate, getMembershipStatus, getDaysUntilExpiry } from '../lib/members'

export default function MemberDetail() {
  const { id } = useParams()
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [member, setMember] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [id, user])

  const fetchData = async () => {
    if (!user || !id) return

    const [memberRes, attendanceRes] = await Promise.all([
      supabase.from('members').select('*').eq('id', id).eq('owner_id', user.id).single(),
      supabase
        .from('attendance')
        .select('*')
        .eq('member_id', id)
        .order('check_in', { ascending: false })
        .limit(10),
    ])

    if (memberRes.error) {
      setError(memberRes.error.message)
    } else {
      setMember(memberRes.data)
    }

    if (!attendanceRes.error) {
      setAttendance(attendanceRes.data || [])
    }

    setLoading(false)
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

  if (!member) {
    return (
      <div className="page">
        <Header title="Member Not Found" onMenuClick={openSidebar} />
        <div className="alert alert-error">{error || 'This member could not be found.'}</div>
      </div>
    )
  }

  const status = getMembershipStatus(member.membership_end)
  const daysLeft = getDaysUntilExpiry(member.membership_end)
  const membersMap = { [member.id]: member }

  return (
    <div className="page">
      <Header
        title={member.full_name}
        subtitle="Member profile & attendance history"
        onMenuClick={openSidebar}
        action={
          <Link to={`/members/${id}/edit`}>
            <Button variant="secondary">
              <Pencil size={16} />
              Edit
            </Button>
          </Link>
        }
      />

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <h2>Membership Details</h2>
            <StatusBadge status={status} />
          </div>
          <div className="detail-items">
            <DetailItem icon={Phone} label="Phone" value={member.phone} />
            {member.email && <DetailItem icon={Mail} label="Email" value={member.email} />}
            <DetailItem icon={Calendar} label="Plan" value={member.membership_type} capitalize />
            <DetailItem icon={Calendar} label="Start Date" value={formatDate(member.membership_start)} />
            <DetailItem icon={Calendar} label="Expiry Date" value={formatDate(member.membership_end)} />
            <DetailItem
              icon={Calendar}
              label="Days Remaining"
              value={
                daysLeft < 0
                  ? `Expired ${Math.abs(daysLeft)} days ago`
                  : daysLeft === 0
                    ? 'Expires today'
                    : `${daysLeft} days`
              }
            />
            {member.notes && (
              <DetailItem icon={FileText} label="Notes" value={member.notes} />
            )}
          </div>
        </div>

        <div className="detail-card">
          <h2>Recent Attendance</h2>
          {attendance.length > 0 ? (
            <AttendanceTable records={attendance} membersMap={membersMap} />
          ) : (
            <p className="detail-empty">No attendance records yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value, capitalize }) {
  return (
    <div className="detail-item">
      <Icon size={18} className="detail-item-icon" />
      <div>
        <span className="detail-item-label">{label}</span>
        <span className={`detail-item-value ${capitalize ? 'capitalize' : ''}`}>{value}</span>
      </div>
    </div>
  )
}
