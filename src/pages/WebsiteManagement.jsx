import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Image,
  Images,
  Dumbbell,
  UserRound,
  Contact,
  MessageSquareQuote,
  ChevronRight,
  ExternalLink,
  Globe2,
  LayoutDashboard,
} from 'lucide-react'
import Header from '../components/Header'

const managementSections = [
  
  {
    id: 'transformations',
    title: 'Transformations',
    description:
      'Add and manage client before & after photos and transformation stories.',
    status: 'Manage stories',
    path: '/website-management/transformations',
    icon: Images,
  },
  {
    id: 'programs',
    title: 'Programs',
    description:
      'Manage training programs, coaching services and website offerings.',
    status: 'Manage programs',
    path: '/website-management/programs',
    icon: Dumbbell,
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description:
      'Manage client reviews and success stories displayed on your website.',
    status: 'Manage testimonials',
    path: '/website-management/testimonials',
    icon: MessageSquareQuote,
  },
  {
    id: 'coach',
    title: 'Coach Profile',
    description:
      'Update coach photos, professional profile, experience and achievements.',
    status: 'Manage profile',
    path: '/website-management/coach',
    icon: UserRound,
  },
  {
    id: 'contact',
    title: 'Contact & Website Info',
    description:
      'Manage contact details, social links and important website information.',
    status: 'Manage information',
    path: '/website-management/contact',
    icon: Contact,
  },

  {
    id: "hero",
    title: "Hero Section",
    description: "Manage homepage hero content",
    status: "Manage Hero",
    path: "/website-management/hero",
    icon: LayoutDashboard
  }
]

export default function WebsiteManagement() {
  const { openSidebar } = useOutletContext()
  const navigate = useNavigate()

  return (
    <div className="page">
      <Header
        title="Website Management"
        subtitle="Control your public Body Engineering website"
        onMenuClick={openSidebar}
      />

      <section className="dashboard-section website-control-center">

        {/* TOP CONTROL PANEL */}
        <div className="website-control-hero">
          <div className="website-control-hero-content">
            <div className="website-control-icon">
              <Globe2 size={26} />
            </div>

            <div>
              <span className="website-control-label">
                BODY ENGINEERING WEBSITE
              </span>

              <h2>Website Control Center</h2>

              <p>
                Manage everything your visitors see on the public website
                from one central dashboard.
              </p>
            </div>
          </div>

          <div className="website-live-status">
            <span className="website-live-dot" />
            Website Live
          </div>
        </div>

        {/* SECTION HEADING */}
        <div className="website-management-heading">
          <div>
            <h3>Manage Website</h3>

            <p className="text-muted">
              Select a section below to update your public website.
            </p>
          </div>
        </div>

        {/* MANAGEMENT CARDS */}
        <div className="website-management-grid">
          {managementSections.map((section) => {
            const Icon = section.icon

            return (
              <button
                type="button"
                className="website-management-card"
                key={section.id}
                onClick={() => navigate(section.path)}
              >
                <div className="website-card-top">
                  <div className="website-card-icon">
                    <Icon size={25} />
                  </div>

                  <ChevronRight
                    className="website-card-arrow"
                    size={21}
                  />
                </div>

                <div className="website-card-content">
                  <h3>{section.title}</h3>

                  <p>
                    {section.description}
                  </p>
                </div>

                <div className="website-card-footer">
                  <span className="website-card-status">
                    <span className="website-card-status-dot" />
                    {section.status}
                  </span>

                  <span className="website-manage-link">
                    Manage
                    <ChevronRight size={15} />
                  </span>
                </div>
              </button>
            )
          })}

          {/* VIEW WEBSITE CARD */}
          <button
            type="button"
            className="website-management-card website-view-card"
            onClick={() => navigate('/')}
          >
            <div className="website-card-top">
              <div className="website-card-icon">
                <ExternalLink size={25} />
              </div>

              <ExternalLink
                className="website-card-arrow"
                size={19}
              />
            </div>

            <div className="website-card-content">
              <h3>View Public Website</h3>

              <p>
                Open your public Body Engineering website and preview
                your latest published changes.
              </p>
            </div>

            <div className="website-card-footer">
              <span className="website-card-status">
                <span className="website-live-dot" />
                Live
              </span>

              <span className="website-manage-link">
                View Website
                <ExternalLink size={14} />
              </span>
            </div>
          </button>
        </div>

      </section>
    </div>
  )
}