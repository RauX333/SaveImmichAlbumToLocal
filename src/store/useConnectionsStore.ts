import { create } from 'zustand'

export interface ConnectionConfig {
  id: string
  name: string
  immichUrl: string
  apiKey: string
  targetAlbumId: string
  targetAlbumName: string
  localPath: string
  lastSyncTime: string
}

interface ConnectionsState {
  connections: ConnectionConfig[]
  activeConnectionId: string | null
  isLoading: boolean
  addConnection: (conn: Omit<ConnectionConfig, 'id' | 'lastSyncTime'>) => void
  updateConnection: (id: string, patch: Partial<ConnectionConfig>) => void
  removeConnection: (id: string) => void
  setActiveConnection: (id: string) => void
  loadConnections: () => Promise<void>
  saveConnections: () => Promise<void>
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  isLoading: true,
  addConnection: (conn) =>
    set((state) => ({
      connections: [
        ...state.connections,
        {
          id: genId(),
          name: conn.name || 'Immich',
          immichUrl: conn.immichUrl || '',
          apiKey: conn.apiKey || '',
          targetAlbumId: conn.targetAlbumId || '',
          targetAlbumName: conn.targetAlbumName || '',
          localPath: conn.localPath || '',
          lastSyncTime: ''
        }
      ]
    })),
  updateConnection: (id, patch) =>
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, ...patch } : c))
    })),
  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
    })),
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  loadConnections: async () => {
    try {
      const data = await window.ipcRenderer.invoke('get-connections')
      set({
        connections: Array.isArray(data?.connections) ? data.connections : [],
        activeConnectionId: data?.activeConnectionId ?? null,
        isLoading: false
      })
    } catch (e) {
      console.error('useConnectionsStore: error loading connections', e)
      set({ isLoading: false })
    }
  },
  saveConnections: async () => {
    const { connections, activeConnectionId } = get()
    try {
      await window.ipcRenderer.invoke('save-connections', { connections, activeConnectionId })
    } catch (e) {
      console.error('useConnectionsStore: error saving connections', e)
      throw e
    }
  }
}))

