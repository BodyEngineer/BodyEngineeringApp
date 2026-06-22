import { Menu } from 'lucide-react'

export default function Header({ title, subtitle, onMenuClick, action }) {
  return (
    <header className="page-header">
      <div className="page-header-left">
        <button type="button" className="menu-toggle" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  )
}
