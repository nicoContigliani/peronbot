import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import { clerkMiddleware, requireAuth } from '@clerk/express'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || 'peronbot'
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

// Helper to require auth
const optionalAuth = (req, res, next) => {
  if (SKIP_AUTH === 'true') {
    req.auth = { publicMetadata: { role: 'admin' } }
    return next()
  }
  return requireAuth()(req, res, next)
}

// Middleware
app.use(cors())
app.use(express.json())

// Clerk middleware
app.use(clerkMiddleware())

// MongoDB Connection
let db
async function connectDB() {
  try {
    console.log('🔄 Connecting to MongoDB...')
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
    console.log('✅ Connected to MongoDB')
    
    // Create indexes
    await db.collection('trees').createIndex({ name: 1 }).catch(() => {})
    await db.collection('users').createIndex({ email: 1 }).catch(() => {})
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
  }
}

// ============ API Routes ============

// Health check - no auth required
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected: !!db,
    timestamp: new Date().toISOString() 
  })
})

// GET /api/stats - Protected
app.get('/api/stats', optionalAuth, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' })
    
    const treeCount = await db.collection('trees').countDocuments()
    const trees = await db.collection('trees').find().toArray()
    const nodeCount = trees.reduce((acc, tree) => acc + (tree.nodes?.length || 0), 0)
    
    // In a real app, you'd track conversations
    const conversationCount = 128 // Placeholder
    const activeUserCount = await db.collection('users').countDocuments({ lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) } }).catch(() => 0)
    
    res.json({
      trees: treeCount,
      nodes: nodeCount,
      conversations: conversationCount,
      activeUsers: activeUserCount
    })
  } catch (error) {
    console.error('Error in /api/stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/trees - Protected
app.get('/api/trees', optionalAuth, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' })
    const trees = await db.collection('trees').find().toArray()
    res.json(trees)
  } catch (error) {
    console.error('Error in /api/trees:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/trees/:id - Protected
app.get('/api/trees/:id', optionalAuth, async (req, res) => {
  try {
    const tree = await db.collection('trees').findOne({ _id: new ObjectId(req.params.id) })
    if (!tree) {
      return res.status(404).json({ error: 'Tree not found' })
    }
    res.json(tree)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/trees - Protected (admin/editor only)
app.post('/api/trees', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin' && role !== 'editor') {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    }
    
    const tree = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await db.collection('trees').insertOne(tree)
    res.status(201).json({ ...tree, _id: result.insertedId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/trees/:id - Protected (admin/editor only)
app.put('/api/trees/:id', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin' && role !== 'editor') {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    }
    
    const tree = {
      ...req.body,
      updatedAt: new Date()
    }
    await db.collection('trees').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: tree }
    )
    res.json({ message: 'Tree updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/trees/:id - Protected (admin only)
app.delete('/api/trees/:id', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }
    
    await db.collection('trees').deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ message: 'Tree deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/users - Protected (admin only)
app.get('/api/users', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }
    
    const users = await db.collection('users').find().toArray()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/users/:id/role - Protected (admin only)
app.patch('/api/users/:id/role', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role: req.body.role } }
    )
    res.json({ message: 'Role updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/settings - Protected
app.get('/api/settings', optionalAuth, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' })
    
    let settings = await db.collection('settings').findOne({ type: 'general' })
    if (!settings) {
      // Default settings
      settings = {
        type: 'general',
        botName: 'PeronBot',
        botDescription: 'Asistente virtual de atención al cliente',
        welcomeMessage: '¡Bienvenido! ¿En qué puedo ayudarte hoy?',
        defaultLanguage: 'es',
        timezone: 'America/Argentina/Buenos_Aires',
        MercadoPagoEnabled: false,
        MongoDBUri: 'mongodb://localhost:27017/peronbot'
      }
      await db.collection('settings').insertOne(settings)
    }
    res.json(settings)
  } catch (error) {
    console.error('Error in /api/settings:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/settings - Protected (admin only)
app.put('/api/settings', optionalAuth, async (req, res) => {
  try {
    const { role } = req.auth?.publicMetadata || {}
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }
    
    await db.collection('settings').updateOne(
      { type: 'general' },
      { $set: { ...req.body, type: 'general' } },
      { upsert: true }
    )
    res.json({ message: 'Settings updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start server
async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

start()
