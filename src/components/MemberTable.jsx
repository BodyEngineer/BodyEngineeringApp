import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, RefreshCw, Utensils } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDate, getMembershipStatus } from '../lib/members'

export default function MemberTable({ members, onDelete, onRenew }) {
  if (!members.length) return null

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Phone</th>
            <th>Plan</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const status = getMembershipStatus(member.membership_end)
            return (
              <tr key={member.id}>
                <td>
                  <div className="member-cell">
                    <span className="member-name">{member.full_name}</span>
                    {member.email && <span className="member-email">{member.email}</span>}
                  </div>
                </td>
                <td>{member.phone}</td>
                <td className="capitalize">{member.membership_type}</td>
                <td>{formatDate(member.membership_end)}</td>
                <td>
                  <StatusBadge status={status} />
                </td>
                <td>
                <div className="table-actions">
  <Link
    to={`/members/${member.id}`}
    className="action-btn"
    title="View"
  >
    <Eye size={16} />
  </Link>

  <Link
    to={`/members/${member.id}/edit`}
    className="action-btn"
    title="Edit"
  >
    <Pencil size={16} />
  </Link>

  <Link
  to={`/members/${member.id}/diet-plan`}
  className="action-btn"
  title="Diet Plan"
>
  <Utensils size={16} />
</Link>

  <button
    type="button"
    className="action-btn"
    title="Renew Membership"
    onClick={() => onRenew(member)}
  >
    <RefreshCw size={16} />
  </button>

  <button
    type="button"
    className="action-btn action-btn-danger"
    title="Delete"
    onClick={() => onDelete(member)}
  >
    <Trash2 size={16} />
  </button>
</div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
