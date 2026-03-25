import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

function SettingsPage() {
  const { user } = useUser()
  const userRole = user?.publicMetadata?.role || 'viewer'
  
  const [settings, setSettings] = useState({
    botName: 'PeronBot',
    botDescription: 'Asistente virtual de atención al cliente',
    welcomeMessage: '¡Bienvenido! ¿En qué puedo ayudarte hoy?',
    defaultLanguage: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    MercadoPagoEnabled: true,
    MercadoPagoAccessToken: '',
    MongoDBUri: 'mongodb://localhost:27017/peronbot',
    ClerkPublishableKey: '',
    ClerkSecretKey: ''
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Fetch settings from API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {
        // Keep default settings
      })
  }, [])

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
    setSaving(false)
  }

  const canEdit = userRole === 'admin'

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="flama-page-header">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flama-page-title"
        >
          Configuración
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flama-page-subtitle"
        >
          Configura las opciones del sistema
        </motion.p>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'grid', gap: 'var(--flama-spacing-lg)' }}>
        
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
          style={{ padding: 'var(--flama-spacing-lg)' }}
        >
          <h3 style={{ marginBottom: 'var(--flama-spacing-lg)' }}>⚙️ Configuración General</h3>
          
          <div style={{ display: 'grid', gap: 'var(--flama-spacing-md)' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--flama-spacing-xs)',
                fontWeight: 500
              }}>
                Nombre del Bot
              </label>
              <input
                type="text"
                className="flama-input"
                value={settings.botName}
                onChange={(e) => handleChange('botName', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--flama-spacing-xs)',
                fontWeight: 500
              }}>
                Descripción
              </label>
              <input
                type="text"
                className="flama-input"
                value={settings.botDescription}
                onChange={(e) => handleChange('botDescription', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--flama-spacing-xs)',
                fontWeight: 500
              }}>
                Mensaje de Bienvenida
              </label>
              <textarea
                className="flama-input"
                rows={3}
                value={settings.welcomeMessage}
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--flama-spacing-md)' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--flama-spacing-xs)',
                  fontWeight: 500
                }}>
                  Idioma
                </label>
                <select
                  className="flama-input"
                  value={settings.defaultLanguage}
                  onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--flama-spacing-xs)',
                  fontWeight: 500
                }}>
                  Zona Horaria
                </label>
                <select
                  className="flama-input"
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  disabled={!canEdit}
                >
                  <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
                  <option value="America/Mexico_City">México (GMT-6)</option>
                  <option value="Europe/Madrid">España (GMT+1)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Integration Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ padding: 'var(--flama-spacing-lg)' }}
        >
          <h3 style={{ marginBottom: 'var(--flama-spacing-lg)' }}>🔌 Integraciones</h3>
          
          <div style={{ display: 'grid', gap: 'var(--flama-spacing-md)' }}>
            {/* MongoDB */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--flama-spacing-xs)',
                fontWeight: 500
              }}>
                MongoDB URI
              </label>
              <input
                type="password"
                className="flama-input"
                value={settings.MongoDBUri}
                onChange={(e) => handleChange('MongoDBUri', e.target.value)}
                disabled={!canEdit}
                placeholder="mongodb://localhost:27017/peronbot"
              />
            </div>
            
            {/* MercadoPago */}
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 'var(--flama-spacing-sm)'
              }}>
                <label style={{ fontWeight: 500 }}>MercadoPago</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--flama-spacing-sm)' }}>
                  <input
                    type="checkbox"
                    checked={settings.MercadoPagoEnabled}
                    onChange={(e) => handleChange('MercadoPagoEnabled', e.target.checked)}
                    disabled={!canEdit}
                  />
                  <span>Habilitado</span>
                </label>
              </div>
              <input
                type="password"
                className="flama-input"
                value={settings.MercadoPagoAccessToken}
                onChange={(e) => handleChange('MercadoPagoAccessToken', e.target.value)}
                disabled={!canEdit || !settings.MercadoPagoEnabled}
                placeholder="ACCESS_TOKEN de MercadoPago"
              />
            </div>
            
            {/* Clerk */}
            <div>
              <h4 style={{ marginBottom: 'var(--flama-spacing-sm)' }}>Clerk Authentication</h4>
              <div style={{ display: 'grid', gap: 'var(--flama-spacing-sm)' }}>
                <input
                  type="text"
                  className="flama-input"
                  value={settings.ClerkPublishableKey}
                  onChange={(e) => handleChange('ClerkPublishableKey', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Clerk Publishable Key (pk_test_...)"
                />
                <input
                  type="password"
                  className="flama-input"
                  value={settings.ClerkSecretKey}
                  onChange={(e) => handleChange('ClerkSecretKey', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Clerk Secret Key (sk_test_...)"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        {canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--flama-spacing-md)' }}
          >
            {saved && (
              <span style={{ 
                color: 'green', 
                alignSelf: 'center',
                fontWeight: 500
              }}>
                ✓ Configuración guardada
              </span>
            )}
            <button 
              className="flama-button neu-button-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
          style={{ 
            padding: 'var(--flama-spacing-lg)',
            background: 'var(--flama-bg-glass-red)'
          }}
        >
          <h3 style={{ marginBottom: 'var(--flama-spacing-sm)' }}>ℹ️ Información del Sistema</h3>
          <p style={{ color: 'var(--flama-text-secondary)', fontSize: 'var(--flama-font-size-sm)' }}>
            PeronBot Dashboard v1.0.0<br />
            Desarrollado con ❤️ usando React, Clerk y MongoDB<br />
            Diseño: FlamaScript (Fire + Hexagons)
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingsPage
