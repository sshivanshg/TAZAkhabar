import { NavLink, Outlet } from 'react-router-dom'
import { clearSession, getDisplayName } from '../auth'
import { theme } from '../theme'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/review', label: 'Review Queue' },
  { to: '/uploads', label: 'Uploads' },
  { to: '/sources', label: 'Sources' },
  { to: '/logs', label: 'Logs' },
]

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.background, color: theme.text, fontFamily: 'system-ui, sans-serif' }}>
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          background: theme.surface,
          borderRight: `1px solid ${theme.border}`,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, padding: '0 8px' }}>NewsFeed Admin</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 4,
              textDecoration: 'none',
              color: isActive ? theme.accent : theme.text,
              background: isActive ? '#EEF1FF' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
            })}
          >
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: 8, fontSize: 12, color: theme.textMuted }}>
          <div>{getDisplayName()}</div>
          <button
            type="button"
            style={{ marginTop: 8, fontSize: 12 }}
            onClick={() => {
              clearSession()
              window.location.assign('/login')
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
