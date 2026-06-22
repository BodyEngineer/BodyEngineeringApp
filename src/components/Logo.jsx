import { Dumbbell } from 'lucide-react'

export default function Logo({ size = 'md', showTagline = false }) {
  const sizes = {
    sm: { icon: 20, title: '1rem', tagline: '0.65rem' },
    md: { icon: 28, title: '1.25rem', tagline: '0.75rem' },
    lg: { icon: 36, title: '1.5rem', tagline: '0.85rem' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className="logo">
      <div className="logo-icon">
        <Dumbbell size={s.icon} strokeWidth={2.5} />
      </div>
      <div className="logo-text">
        <span className="logo-title" style={{ fontSize: s.title }}>
          Body <span className="logo-accent">Engineering</span>
        </span>
        {showTagline && (
          <span className="logo-tagline" style={{ fontSize: s.tagline }}>
            Premium Gym Management
          </span>
        )}
      </div>
    </div>
  )
}
