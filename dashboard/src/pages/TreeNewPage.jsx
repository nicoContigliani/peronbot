import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTreesStore } from '../store/appStore'
import { PageHeader, Card, Button, Input } from '../components/ui'

function TreeNewPage() {
  const navigate = useNavigate()
  const { createTree } = useTreesStore()
  const [loading, setLoading] = useState(false)
  const [treeName, setTreeName] = useState('')
  const [treeDescription, setTreeDescription] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!treeName.trim()) return

    setLoading(true)
    try {
      const newTree = await createTree({
        name: treeName,
        description: treeDescription,
        nodes: [
          {
            id: 'start',
            type: 'message',
            label: 'Inicio',
            content: '¡Bienvenido! ¿En qué puedo ayudarte?',
            x: 100,
            y: 100
          }
        ]
      })
      navigate(`/trees/${newTree._id}`)
    } catch (err) {
      console.error('Error creating tree:', err)
    }
    setLoading(false)
  }

  return (
    <div className="tree-new-page">
      <PageHeader 
        title="Nuevo Árbol"
        subtitle="Crea un nuevo flujo de conversación"
      />

      <Card style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600' 
            }}>
              Nombre del Árbol *
            </label>
            <Input
              placeholder="Ej: Menú Principal, Ventas, Soporte..."
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600' 
            }}>
              Descripción
            </label>
            <textarea
              className="input-field"
              placeholder="Describe brevemente el propósito de este árbol..."
              value={treeDescription}
              onChange={(e) => setTreeDescription(e.target.value)}
              rows="3"
              style={{ resize: 'vertical', marginBottom: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <Button 
              type="submit" 
              variant="primary"
              disabled={loading || !treeName.trim()}
            >
              {loading ? 'Creando...' : '✓ Crear Árbol'}
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => navigate('/trees')}
            >
              ✕ Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TreeNewPage
