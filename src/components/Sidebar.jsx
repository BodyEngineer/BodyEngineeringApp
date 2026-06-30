import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  Bell,
  ClipboardList,
  LogOut,
  X,
} from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },

  { to: '/members', icon: Users, label: 'Members' },

  { to: '/members/add', icon: UserPlus, label: 'Add Member' },

  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },

  {
    to: '/body-assessment',
    icon: ClipboardList,
    label: 'Transformation Assessment',
  },

  { to: '/alerts', icon: Bell, label: 'Renewal Alerts' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Logo size="sm" showTagline />
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-link nav-link-logout" onClick={handleSignOut}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
