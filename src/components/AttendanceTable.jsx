import { formatDateTime } from '../lib/members'

export default function AttendanceTable({ records, membersMap }) {
  if (!records.length) return null

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const member = membersMap[record.member_id]
            const duration = getDuration(record.check_in, record.check_out)

            return (
              <tr key={record.id}>
                <td>
                  <span className="member-name">{member?.full_name || 'Unknown'}</span>
                </td>
                <td>{formatDateTime(record.check_in)}</td>
                <td>{record.check_out ? formatDateTime(record.check_out) : '—'}</td>
                <td>{duration}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function getDuration(checkIn, checkOut) {
  if (!checkOut) return 'In gym'
  const diff = new Date(checkOut) - new Date(checkIn)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
