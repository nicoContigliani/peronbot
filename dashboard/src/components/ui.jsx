import { Link } from 'react-router-dom'

// Reusable Stat Card Component
export function StatCard({ value, label }) {
  return (
    <div className="card-module">
      <h2>{value}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>{label}</p>
    </div>
  )
}

// Reusable Card Component
export function Card({ children, className = '' }) {
  return (
    <div className={`card-module ${className}`}>
      {children}
    </div>
  )
}

// Reusable Input Component
export function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name,
  required = false,
  className = '' 
}) {
  return (
    <input
      type={type}
      className={`input-field ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
    />
  )
}

// Reusable Button Component
export function Button({ 
  children, 
  variant = 'primary', 
  type = 'button',
  onClick,
  className = '',
  disabled = false 
}) {
  return (
    <button 
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Reusable Page Header Component
export function PageHeader({ title, subtitle }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  )
}

// Reusable Stats Grid Component
export function StatsGrid({ children }) {
  return (
    <div className="stats-grid">
      {children}
    </div>
  )
}

// Reusable Dashboard Card
export function DashboardCard({ icon, title, description, to, onClick, children }) {
  const content = (
    <>
      {icon && <div className="dashboard-card-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="dashboard-card" style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return (
    <div className="dashboard-card">
      {content}
    </div>
  )
}

// Reusable Activity Item
export function ActivityItem({ icon, text }) {
  return (
    <div className="activity-item">
      <span className="activity-icon">{icon}</span>
      <span className="activity-text">{text}</span>
    </div>
  )
}

// Reusable Table Row
export function TableRow({ children, actions }) {
  return (
    <div className="table-row">
      <div className="table-row-content">
        {children}
      </div>
      {actions && <div className="table-row-actions">{actions}</div>}
    </div>
  )
}
