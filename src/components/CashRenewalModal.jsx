import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'

export default function CashRenewalModal({
  member,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [renewalPeriod, setRenewalPeriod] = useState('monthly')
  const [renewalAmount, setRenewalAmount] = useState('')

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRenewalPeriod('monthly')
      setRenewalAmount('')
    }
  }, [isOpen])

  const monthsMap = {
    monthly: 1,
    quarterly: 3,
    'half-yearly': 6,
    yearly: 12,
  }

  const calculateNewExpiry = () => {
    if (!member) return null

    const today = new Date()

    const currentExpiry = member.membership_end
      ? new Date(member.membership_end)
      : null

    const baseDate =
      currentExpiry && currentExpiry > today
        ? currentExpiry
        : today

    const newExpiry = new Date(baseDate)

    newExpiry.setMonth(
      newExpiry.getMonth() + monthsMap[renewalPeriod]
    )

    return newExpiry.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleConfirm = () => {
    if (!renewalAmount || Number(renewalAmount) <= 0) {
      return
    }

    onConfirm({
      renewalPeriod,
      renewalAmount: Number(renewalAmount),
    })
  }

  if (!member) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (loading) return
        onClose()
      }}
      title="💵 Cash Renewal"
      size="sm"
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '6px' }}>
          {member.full_name}
        </h3>

        <p style={{ opacity: 0.7 }}>
          {member.phone}
        </p>
      </div>

      <div
        style={{
          background: '#1b1b1b',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '18px',
        }}
      >
        <p>
          <strong>Current Plan:</strong>{' '}
          {member.membership_type || '—'}
        </p>

        <p>
          <strong>Current Expiry:</strong>{' '}
          {member.membership_end
            ? new Date(
                member.membership_end
              ).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'No expiry'}
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">
          Renewal Period
        </label>

        <select
          value={renewalPeriod}
          onChange={(e) =>
            setRenewalPeriod(e.target.value)
          }
          className="form-input"
          disabled={loading}
        >
          <option value="monthly">
            Monthly — 1 Month
          </option>

          <option value="quarterly">
            Quarterly — 3 Months
          </option>

          <option value="half-yearly">
            Half-Yearly — 6 Months
          </option>

          <option value="yearly">
            Yearly — 12 Months
          </option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Cash Amount
        </label>

        <input
          type="number"
          min="0"
          step="1"
          placeholder="Enter amount"
          value={renewalAmount}
          onChange={(e) =>
            setRenewalAmount(e.target.value)
          }
          className="form-input"
          disabled={loading}
        />
      </div>

      <div
        style={{
          background: '#171717',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '18px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontWeight: '700',
            marginBottom: '10px',
          }}
        >
          📅 Renewal Preview
        </div>

        <p style={{ marginBottom: '8px' }}>
          <strong>Payment:</strong> 💵 Cash
        </p>

        <p style={{ marginBottom: '8px' }}>
          <strong>Period:</strong>{' '}
          {renewalPeriod === 'monthly'
            ? '1 Month'
            : renewalPeriod === 'quarterly'
            ? '3 Months'
            : renewalPeriod === 'half-yearly'
            ? '6 Months'
            : '12 Months'}
        </p>

        <p>
          <strong>New Expiry:</strong>{' '}
          {calculateNewExpiry()}
        </p>
      </div>

      <div className="modal-actions">
        <Button
          variant="ghost"
          disabled={loading}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          loading={loading}
          disabled={
            !renewalAmount ||
            Number(renewalAmount) <= 0
          }
          onClick={handleConfirm}
        >
          💵 Confirm Cash Renewal
        </Button>
      </div>
    </Modal>
  )
}