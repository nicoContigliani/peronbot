import { Outlet, NavLink } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

// Reusable Sidebar Link Component
function SidebarLink({ to, icon, children }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
    >
      <span className="sidebar-icon">{icon}</span>
      <span>{children}</span>
    </NavLink>
  )
}

function Layout() {
  const { user } = useUser()
  const userRole = user?.publicMetadata?.role || 'viewer'

  return (
    <>
      {/* Background */}
      <div className="hexagon-bg"></div>
      
      {/* Top Navigation */}
      <nav className="top-nav">
        <a href="/" className="nav-brand">
          <div className="nav-brand-icon">P</div>
          <span>PeronBot</span>
        </a>
        
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Inicio
          </NavLink>
          <NavLink to="/trees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Árboles
          </NavLink>
          {userRole === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Usuarios
            </NavLink>
          )}
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Configuración
          </NavLink>
        </div>

        <UserButton />
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <SidebarLink to="/" icon="🏠">Dashboard</SidebarLink>
          <SidebarLink to="/trees" icon="🌲">Árboles</SidebarLink>
          <SidebarLink to="/trees/new" icon="➕">Nuevo</SidebarLink>
          {userRole === 'admin' && (
            <SidebarLink to="/users" icon="👥">Usuarios</SidebarLink>
          )}
          <SidebarLink to="/settings" icon="⚙️">Ajustes</SidebarLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </>
  )
}

export default Layout
