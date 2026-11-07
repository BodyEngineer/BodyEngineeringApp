import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Megaphone,
  Users,
  Send,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BellRing,
  Clock3,
  XCircle,
} from 'lucide-react'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'
import './Notification.css'

export default function Notifications() {
  const { openSidebar } = useOutletContext()

  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)

      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = authData?.user

      if (!user) {
        throw new Error('Please log in again.')
      }

      const { data, error: historyError } = await supabase
        .from('studio_notifications')
        .select(
          'id, message, recipient_count, success_count, failure_count, status, created_at, sent_at'
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (historyError) throw historyError

      setHistory(data || [])
    } catch (err) {
      console.error('Notification history error:', err)
      setError(err.message || 'Unable to load notification history.')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const announcement = message.trim()

    if (!announcement) {
      setError('Please enter an announcement.')
      return
    }

    if (announcement.length > 1000) {
      setError('Announcement must be 1000 characters or fewer.')
      return
    }

    const confirmed = window.confirm(
      'Send this announcement immediately to all active gym members who have enabled notifications?'
    )

    if (!confirmed) return

    try {
      setSending(true)

      const { data, error: sendError } =
        await supabase.functions.invoke(
          'send-studio-notification',
          {
            body: { message: announcement },
          }
        )

      if (sendError) throw sendError

      if (!data?.success) {
        const details = Array.isArray(data?.failure_details)
          ? data.failure_details.join('\n')
          : data?.details || data?.error
      
        throw new Error(
          details || 'Unable to send the announcement.'
        )
      }

      if (data.recipient_count === 0) {
        setSuccess(
          data.message ||
          'No active members currently have notifications enabled.'
        )
      } else {
        setSuccess(
          `Announcement processed. Successful deliveries: ${data.success_count}. Failed deliveries: ${data.failure_count}.`
        )
      }

      setMessage('')
      await loadHistory()
    } catch (err) {
      console.error('Send announcement error:', err)
      setError(
        err.message || 'Unable to send announcement. Please try again.'
      )
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatus = (status) => {
    switch (status) {
      case 'sent':
        return {
          label: 'Sent',
          className: 'ne-status-sent',
          icon: CheckCircle2,
        }
      case 'partial':
        return {
          label: 'Partially sent',
          className: 'ne-status-partial',
          icon: AlertCircle,
        }
      case 'failed':
        return {
          label: 'Failed',
          className: 'ne-status-failed',
          icon: XCircle,
        }
      case 'pending':
        return {
          label: 'Processing',
          className: 'ne-status-pending',
          icon: Clock3,
        }
      default:
        return {
          label: status || 'Unknown',
          className: 'ne-status-pending',
          icon: Clock3,
        }
    }
  }

  return (
    <div className="page notification-page">
      <Header
        title="Notifications"
        subtitle="Send announcements to your gym members"
        onMenuClick={openSidebar}
      />

      <div className="ne-container">

        {/* Intro banner */}
        <section className="ne-hero">
          <div className="ne-hero-content">
            <div className="ne-eyebrow">
              <span className="ne-live-dot" />
              BODY ENGINEERING • MEMBER COMMUNICATION
            </div>

            <h2>Notification Centre</h2>

            <p>
              Keep your members informed, connected and up to date
              with important studio announcements.
            </p>
          </div>

          <div className="ne-hero-icon">
            <BellRing size={35} />
          </div>
        </section>

        {/* Main layout */}
        <div className="ne-layout">

          {/* Compose announcement */}
          <section className="ne-card ne-compose-card">
            <div className="ne-section-heading">
              <div className="ne-heading-icon">
                <Megaphone size={21} />
              </div>

              <div>
                <h3>New Announcement</h3>
                <p>Compose a message for your members.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ne-field">
                <div className="ne-field-heading">
                  <label htmlFor="announcement-message">
                    Announcement Message
                  </label>

                  <span>{message.length}/1000</span>
                </div>

                <textarea
                  id="announcement-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement here..."
                  rows={7}
                  maxLength={1000}
                  required
                  disabled={sending}
                />

                <p className="ne-helper-text">
                  Keep your message clear and easy to understand.
                </p>
              </div>

              {/* Recipients */}
              <div className="ne-info-panel">
                <div className="ne-info-icon">
                  <Users size={21} />
                </div>

                <div className="ne-info-content">
                  <strong>All Active Gym Members</strong>
                  <p>
                    Only active members belonging to your owner
                    account are included. Online clients and
                    inactive members are excluded.
                  </p>
                </div>

                <span className="ne-recipient-tag">GYM</span>
              </div>

              {/* Delivery */}
              <div className="ne-delivery-panel">
                <div className="ne-delivery-icon">
                  <Send size={19} />
                </div>

                <div>
                  <strong>Send Immediately</strong>
                  <p>Your announcement will be sent as soon as you confirm.</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="ne-feedback ne-feedback-error" role="alert">
                  <AlertCircle size={19} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="ne-feedback ne-feedback-success" role="status">
                  <CheckCircle2 size={19} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                className="ne-send-button"
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <>
                    <RefreshCw className="ne-spinning" size={19} />
                    Sending Announcement...
                  </>
                ) : (
                  <>
                    <Send size={19} />
                    Send Announcement
                  </>
                )}
              </button>

              <p className="ne-security-note">
                <CheckCircle2 size={14} />
                Only authorised studio owners can send announcements.
              </p>
            </form>
          </section>

          {/* Notification history */}
          <section className="ne-card ne-history-card">
            <div className="ne-section-heading ne-history-heading">
              <div className="ne-heading-icon">
                <History size={21} />
              </div>

              <div>
                <h3>Notification History</h3>
                <p>Recent announcements and delivery reports.</p>
              </div>

              <button
                type="button"
                className="ne-refresh-button"
                onClick={loadHistory}
                disabled={loadingHistory}
                title="Refresh notification history"
              >
                <RefreshCw
                  size={17}
                  className={loadingHistory ? 'ne-spinning' : ''}
                />
              </button>
            </div>

            <div className="ne-history-summary">
              <div>
                <span className="ne-summary-label">TOTAL ANNOUNCEMENTS</span>
                <strong>{history.length}</strong>
              </div>

              <div className="ne-summary-icon">
                <Megaphone size={23} />
              </div>
            </div>

            {loadingHistory ? (
              <div className="ne-empty-state">
                <RefreshCw size={27} className="ne-spinning" />
                <h4>Loading history</h4>
                <p>Please wait while we fetch your announcements.</p>
              </div>
            ) : history.length === 0 ? (
              <div className="ne-empty-state">
                <div className="ne-empty-icon">
                  <Megaphone size={29} />
                </div>
                <h4>No announcements yet</h4>
                <p>
                  Your sent announcements and delivery reports
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="ne-history-list">
                {history.map((item) => {
                  const status = getStatus(item.status)
                  const StatusIcon = status.icon

                  return (
                    <article className="ne-history-item" key={item.id}>
                      <div className="ne-history-item-top">
                        <div className="ne-history-title">
                          <Megaphone size={17} />
                          <strong>Studio Announcement</strong>
                        </div>

                        <span className={`ne-status ${status.className}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </div>

                      <p className="ne-history-message">
                        {item.message}
                      </p>

                      <div className="ne-delivery-stats">
                        <span>
                          <Users size={14} />
                          Devices: {item.recipient_count ?? 0}
                        </span>

                        <span>
                          <CheckCircle2 size={14} />
                          Successful: {item.success_count ?? 0}
                        </span>

                        <span>
                          <AlertCircle size={14} />
                          Failed: {item.failure_count ?? 0}
                        </span>
                      </div>

                      <div className="ne-history-date">
                        <Clock3 size={13} />
                        {formatDate(item.sent_at || item.created_at)}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}