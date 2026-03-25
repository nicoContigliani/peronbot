import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTreesStore } from '../store/appStore'
import { PageHeader, Card, Button, Input } from '../components/ui'

function TreesPage() {
  const { trees, loading, fetchTrees, deleteTree } = useTreesStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTrees()
  }, [fetchTrees])

  const filteredTrees = trees.filter(tree => 
    tree.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id, e) => {
    e.preventDefault()
    if (confirm('¿Estás seguro de eliminar este árbol?')) {
      await deleteTree(id)
    }
  }

  return (
    <div className="trees-page">
      {/* Page Header */}
      <PageHeader 
        title="Árboles de Conversación"
        subtitle="Diseña y gestiona tus flujos de conversación"
      />

      {/* Actions Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <Input
            placeholder="Buscar árboles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/trees/new">
          <Button variant="primary">➕ Nuevo Árbol</Button>
        </Link>
      </div>

      {/* Trees List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <p>Cargando...</p>
          </Card>
        ) : filteredTrees.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌲</div>
            <h3 style={{ marginBottom: '8px' }}>No hay árboles</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Crea tu primer árbol de conversación
            </p>
            <Link to="/trees/new">
              <Button variant="primary">➕ Crear Árbol</Button>
            </Link>
          </Card>
        ) : (
          filteredTrees.map(tree => (
            <div key={tree._id} className="table-row">
              <div className="table-row-content">
                <span style={{ fontSize: '32px' }}>🌲</span>
                <div>
                  <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{tree.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {tree.nodes?.length || 0} nodos
                  </p>
                </div>
              </div>
              <div className="table-row-actions">
                <Link to={`/trees/${tree._id}`}>
                  <Button variant="secondary">✏️ Editar</Button>
                </Link>
                <Button 
                  variant="secondary" 
                  onClick={(e) => handleDelete(tree._id, e)}
                  style={{ color: '#ff0000' }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TreesPage
