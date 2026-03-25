import { create } from 'zustand'

// App Store - Global state management
export const useAppStore = create((set, get) => ({
  // Stats
  stats: {
    trees: 0,
    nodes: 0,
    conversations: 0,
    activeUsers: 0
  },
  setStats: (stats) => set({ stats }),
  
  // Trees
  trees: [],
  setTrees: (trees) => set({ trees }),
  addTree: (tree) => set((state) => ({ 
    trees: [...state.trees, tree] 
  })),
  updateTree: (id, updates) => set((state) => ({
    trees: state.trees.map(t => 
      t._id === id ? { ...t, ...updates } : t
    )
  })),
  deleteTree: (id) => set((state) => ({
    trees: state.trees.filter(t => t._id !== id)
  })),
  
  // Users (for admin)
  users: [],
  setUsers: (users) => set({ users }),
  updateUserRole: (id, role) => set((state) => ({
    users: state.users.map(u => 
      u._id === id ? { ...u, role } : u
    )
  })),
  
  // Settings
  settings: {
    botName: 'PeronBot',
    botDescription: '',
    welcomeMessage: '',
    defaultLanguage: 'es',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  setSettings: (settings) => set({ settings }),
  
  // UI State
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  
  // Sidebar state (for mobile)
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  // Selected items
  selectedTree: null,
  setSelectedTree: (tree) => set({ selectedTree: tree }),
  
  // Notifications
  notification: null,
  showNotification: (message, type = 'info') => set({ 
    notification: { message, type } 
  }),
  clearNotification: () => set({ notification: null })
}))

// Stats Store - specific for dashboard stats
export const useStatsStore = create((set) => ({
  stats: {
    trees: 0,
    nodes: 0,
    conversations: 0,
    activeUsers: 0
  },
  loading: false,
  error: null,
  
  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      set({ stats: data, loading: false })
    } catch (error) {
      // Use demo data on error
      set({ 
        stats: { trees: 5, nodes: 42, conversations: 128, activeUsers: 3 },
        loading: false,
        error: error.message 
      })
    }
  }
}))

// Trees Store - for tree management
export const useTreesStore = create((set) => ({
  trees: [],
  loading: false,
  error: null,
  
  fetchTrees: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/trees')
      if (!res.ok) throw new Error('Failed to fetch trees')
      const data = await res.json()
      set({ trees: data, loading: false })
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },
  
  createTree: async (treeData) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treeData)
      })
      if (!res.ok) throw new Error('Failed to create tree')
      const newTree = await res.json()
      set((state) => ({ 
        trees: [...state.trees, newTree],
        loading: false 
      }))
      return newTree
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },
  
  updateTree: async (id, updates) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/trees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update tree')
      set((state) => ({
        trees: state.trees.map(t => 
          t._id === id ? { ...t, ...updates } : t
        ),
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },
  
  deleteTree: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/trees/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete tree')
      set((state) => ({
        trees: state.trees.filter(t => t._id !== id),
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  }
}))

// Settings Store
export const useSettingsStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,
  
  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      set({ settings: data, loading: false })
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },
  
  updateSettings: async (updates) => {
    set({ loading: true })
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update settings')
      set((state) => ({
        settings: { ...state.settings, ...updates },
        loading: false
      }))
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  }
}))
