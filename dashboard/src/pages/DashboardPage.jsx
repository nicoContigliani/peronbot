import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useStatsStore } from '../store/appStore'
import { PageHeader, StatsGrid, StatCard, ActivityItem, Button } from '../components/ui'

function DashboardPage() {
  const { user } = useUser()
  const { stats, loading, fetchStats } = useStatsStore()

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const quickActions = [
    { icon: '🌲', title: 'Árboles', desc: 'Gestiona flujos', to: '/trees' },
    { icon: '➕', title: 'Nuevo', desc: 'Crea flujo', to: '/trees/new' },
    { icon: '📊', title: 'Stats', desc: 'Análisis', to: '/stats' },
    { icon: '⚙️', title: 'Ajustes', desc: 'Config', to: '/settings' }
  ]

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader 
        title={`¡Hola, ${user?.firstName || 'Usuario'}! 👋`}
        subtitle="Aquí está lo que está pasando con tu bot"
      />

      {/* Stats Cards */}
      <StatsGrid>
        <StatCard value={loading ? '...' : stats.trees} label="Árboles" />
        <StatCard value={loading ? '...' : stats.nodes} label="Nodos" />
        <StatCard value={loading ? '...' : stats.conversations} label="Conversaciones" />
        <StatCard value={loading ? '...' : stats.activeUsers} label="Activos" />
      </StatsGrid>

      {/* Quick Actions Grid */}
      <div className="dashboard-grid">
        {quickActions.map((action, index) => (
          <a key={index} href={action.to} className="dashboard-card" style={{ textDecoration: 'none' }}>
            <div className="dashboard-card-icon">{action.icon}</div>
            <h3>{action.title}</h3>
            <p>{action.desc}</p>
          </a>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="activity-list">
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
          📝 Actividad Reciente
        </h3>
        
        <ActivityItem icon="🌲" text='Árbol "Menú Principal" actualizado' />
        <ActivityItem icon="👤" text='Nuevo usuario registrado' />
        <ActivityItem icon="💬" text='42 conversaciones procesadas hoy' />
      </div>
    </div>
  )
}

export default DashboardPage
