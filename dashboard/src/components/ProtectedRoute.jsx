import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

/**
 * ProtectedRoute - Protects routes based on authentication and roles
 * @param {ReactNode} children - Child components to render
 * @param {string[]} allowedRoles - Optional array of allowed roles
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isLoaded, isSignedIn, user } = useUser()

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="login-container">
        <div className="flama-loading">
          <div className="flama-spinner"></div>
        </div>
      </div>
    )
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  // Get user role from Clerk metadata or public metadata
  const userRole = user?.publicMetadata?.role || 'viewer'
  
  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
