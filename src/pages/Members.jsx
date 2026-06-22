import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Search, UserPlus } from 'lucide-react'
import Header from '../components/Header'
import MemberTable from '../components/MemberTable'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getMembershipStatus } from '../lib/members'

export default function Members() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [user])

  const fetchMembers = async () => {
    if (!user) return
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('owner_id', user.id)
      .order('full_name')

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setMembers(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('id', deleteTarget.id)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
    setDeleting(false)
  }

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'all') return matchesSearch
    return matchesSearch && getMembershipStatus(m.membership_end) === filter
  })

  return (
    <div className="page">
      <Header
        title="Member Management"
        subtitle={`${members.length} total member${members.length !== 1 ? 's' : ''}`}
        onMenuClick={openSidebar}
        action={
          <Link to="/members/add">
            <Button>
              <UserPlus size={18} />
              Add Member
            </Button>
          </Link>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'expiring', 'expired'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-tab ${filter === f ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length > 0 ? (
        <MemberTable members={filtered} onDelete={setDeleteTarget} />
      ) : (
        <EmptyState
          title={search || filter !== 'all' ? 'No members found' : 'No members yet'}
          description={
            search || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add your first member to get started.'
          }
          action={
            !search && filter === 'all' && (
              <Link to="/members/add">
                <Button>Add First Member</Button>
              </Link>
            )
          }
        />
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Member"
        size="sm"
      >
        <p className="modal-text">
          Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This action
          cannot be undone and will remove all associated attendance records.
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
