import { NavLink, Outlet } from 'react-router-dom'
import { clearSession, getAdminIdentity } from '../auth'
import { LiveRunProvider } from '../live/LiveRunContext'
import { LiveRunDock } from './LiveRunDock'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/review', label: 'Review' },
  { to: '/uploads', label: 'Uploads' },
  { to: '/sources', label: 'Sources' },
  { to: '/logs', label: 'Logs' },
]

export function Layout() {
  return (
    <LiveRunProvider>
      <div className="shell">
        <aside className="shell-nav">
          <div className="shell-brand">
            TazaKhabar
            <span>Admin</span>
          </div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="shell-user">
            <div>{getAdminIdentity()}</div>
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 8, fontSize: 12, padding: '4px 0' }}
              onClick={() => {
                clearSession()
                window.location.assign('/login')
              }}
            >
              Log out
            </button>
          </div>
        </aside>
        <main className="shell-main">
          <Outlet />
        </main>
        <LiveRunDock />
      </div>
    </LiveRunProvider>
  )
}
