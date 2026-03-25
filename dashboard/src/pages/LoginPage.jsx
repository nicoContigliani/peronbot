import { SignIn } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

function LoginPage() {
  const { isSignedIn, isLoaded } = useUser()

  // Redirect if already signed in
  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="login-page">
      {/* Brand Panel */}
      <div className="login-brand-panel">
        <div className="login-logo" style={{ fontSize: '64px', marginBottom: '32px' }}>
          🔥
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px' }}>PeronBot</h1>
        <p style={{ fontSize: '18px', opacity: '0.9', maxWidth: '300px', textAlign: 'center' }}>
          Gestiona tus flujos de conversación de manera profesional
        </p>
      </div>

      {/* Form Side */}
      <div className="login-form-side">
        <div className="login-glass-card fade-in">
          <h2 className="login-title">Bienvenido</h2>
          <p className="login-subtitle">
            Ingresa a tu cuenta para continuar
          </p>
          
          {/* Clerk Sign In */}
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'login-signin',
                card: 'login-card-inner',
                formButtonPrimary: 'btn btn-primary',
                formFieldInput: 'input-field',
                formFieldLabel: 'input-label',
                footerActionLink: 'nav-link'
              }
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
