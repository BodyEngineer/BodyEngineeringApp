export function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function calculateMembershipEnd(startDate, membershipType) {
  const start = new Date(startDate)
  const months = membershipType === 'yearly' ? 12 : membershipType === 'quarterly' ? 3 : 1
  return addMonths(start, months).toISOString().split('T')[0]
}

export function getMembershipStatus(membershipEnd) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(membershipEnd)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'expiring'
  return 'active'
}

export function getDaysUntilExpiry(membershipEnd) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(membershipEnd)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export function isActive(membershipEnd) {
  return getMembershipStatus(membershipEnd) !== 'expired'
}

export function isExpiringThisWeek(membershipEnd) {
  const days = getDaysUntilExpiry(membershipEnd)
  return days >= 0 && days <= 7
}

export function isRenewalDue(membershipEnd) {
  const days = getDaysUntilExpiry(membershipEnd)
  return days < 0 || (days >= 0 && days <= 3)
}

export function computeDashboardStats(members) {
  return {
    totalMembers: members.length,
    activeMembers: members.filter((m) => isActive(m.membership_end)).length,
    expiringThisWeek: members.filter((m) => isExpiringThisWeek(m.membership_end)).length,
    renewalsDue: members.filter((m) => isRenewalDue(m.membership_end)).length,
  }
}

export function getRenewalAlerts(members) {
  return members
    .filter((m) => isRenewalDue(m.membership_end))
    .map((m) => ({
      ...m,
      daysUntilExpiry: getDaysUntilExpiry(m.membership_end),
      status: getMembershipStatus(m.membership_end),
    }))
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const MEMBERSHIP_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]
