import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import ProtectedRoute from '../components/ProtectedRoute'

function UsersPage() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch users from API
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => {
        // Demo data
        setUsers([
          {
            id: '1',
            email: 'admin@peronbot.com',
            name: 'Admin Principal',
            role: 'admin',
            createdAt: '2024-01-15',
            lastActive: '2024-03-20'
          },
          {
            id: '2',
            email: 'editor@peronbot.com',
            name: 'Editor de Contenido',
            role: 'editor',
            createdAt: '2024-02-01',
            lastActive: '2024-03-19'
          },
          {
            id: '3',
            email: 'viewer@peronbot.com',
            name: 'Usuario de Solo Lectura',
            role: 'viewer',
            createdAt: '2024-02-15',
            lastActive: '2024-03-18'
          }
        ])
        setLoading(false)
      })
  }, [])

  const handleRoleChange = (userId, newRole) => {
    // Optimistic update
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ))
    
    // API call would go here
    fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    }).catch(err => {
      console.error('Failed to update role:', err)
    })
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'role-badge-admin'
      case 'editor':
        return 'role-badge-editor'
      default:
        return 'role-badge-viewer'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'editor':
        return 'Editor'
      default:
        return 'Visor'
    }
  }

  if (loading) {
    return (
      <div className="flama-loading">
        <div className="flama-spinner"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="users-page">
        {/* Page Header */}
        <div className="flama-page-header">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flama-page-title"
          >
            Gestión de Usuarios
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flama-page-subtitle"
          >
            Administra los usuarios y sus permisos
          </motion.p>
        </div>

        {/* Stats */}
        <div className="flama-grid flama-grid-3" style={{ marginBottom: 'var(--flama-spacing-xl)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flama-stat-card"
          >
            <div className="flama-stat-value">{users.length}</div>
            <div className="flama-stat-label">Total Usuarios</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flama-stat-card"
          >
            <div className="flama-stat-value">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="flama-stat-label">Administradores</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flama-stat-card"
          >
            <div className="flama-stat-value">
              {users.filter(u => u.role === 'editor').length}
            </div>
            <div className="flama-stat-label">Editores</div>
          </motion.div>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
          style={{ padding: 'var(--flama-spacing-lg)', overflowX: 'auto' }}
        >
          <table className="flama-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Última Actividad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--flama-spacing-md)' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--flama-primary), var(--flama-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>{user.lastActive}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="flama-input"
                      style={{ width: 'auto', padding: 'var(--flama-spacing-sm)' }}
                    >
                      <option value="viewer">Visor</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Role Descriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 'var(--flama-spacing-xl)' }}
        >
          <h3 style={{ marginBottom: 'var(--flama-spacing-md)' }}>Roles y Permisos</h3>
          <div className="flama-grid flama-grid-3">
            <div className="glass-card" style={{ padding: 'var(--flama-spacing-lg)' }}>
              <h4 style={{ color: 'var(--flama-primary)', marginBottom: 'var(--flama-spacing-sm)' }}>
                👑 Administrador
              </h4>
              <ul style={{ fontSize: 'var(--flama-font-size-sm)', color: 'var(--flama-text-secondary)' }}>
                <li>Acceso completo a todas las funcionalidades</li>
                <li>Gestión de usuarios y roles</li>
                <li>Edición y eliminación de árboles</li>
                <li>Configuración del sistema</li>
              </ul>
            </div>
            <div className="glass-card" style={{ padding: 'var(--flama-spacing-lg)' }}>
              <h4 style={{ color: 'var(--flama-secondary)', marginBottom: 'var(--flama-spacing-sm)' }}>
                ✏️ Editor
              </h4>
              <ul style={{ fontSize: 'var(--flama-font-size-sm)', color: 'var(--flama-text-secondary)' }}>
                <li>Edición de árboles de conversación</li>
                <li>Creación de nuevos nodos</li>
                <li>Solo lectura de usuarios</li>
                <li>Configuración básica</li>
              </ul>
            </div>
            <div className="glass-card" style={{ padding: 'var(--flama-spacing-lg)' }}>
              <h4 style={{ color: 'var(--flama-text-secondary)', marginBottom: 'var(--flama-spacing-sm)' }}>
                👁️ Visor
              </h4>
              <ul style={{ fontSize: 'var(--flama-font-size-sm)', color: 'var(--flama-text-secondary)' }}>
                <li>Solo lectura del dashboard</li>
                <li>Ver árboles de conversación</li>
                <li>Sin capacidad de edición</li>
                <li>Sin acceso a configuración</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}

export default UsersPage
