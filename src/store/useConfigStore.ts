import { create } from 'zustand'

export interface Config {
  immichUrl: string
  apiKey: string
  targetAlbumId: string
  targetAlbumName: string
  localPath: string
  lastSyncTime: string
}

interface ConfigState {
  config: Config
  persistedConfig: Config
  isLoading: boolean
  setConfig: (config: Partial<Config>) => void
  loadConfig: () => Promise<void>
  saveConfig: () => Promise<void>
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: {
    immichUrl: '',
    apiKey: '',
    targetAlbumId: '',
    targetAlbumName: '',
    localPath: '',
    lastSyncTime: ''
  },
  persistedConfig: {
    immichUrl: '',
    apiKey: '',
    targetAlbumId: '',
    targetAlbumName: '',
    localPath: '',
    lastSyncTime: ''
  },
  isLoading: true,
  setConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
  loadConfig: async () => {
    try {
      console.log('useConfigStore: fetching config...')
      // Add timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching config')), 5000)
      )
      
      let config = await Promise.race([
        window.ipcRenderer.invoke('get-config'),
        timeoutPromise
      ]) as Config
      
      // Ensure config is a valid object
      if (!config || typeof config !== 'object') {
        console.warn('useConfigStore: received invalid config, using defaults')
        config = {
          immichUrl: '',
          apiKey: '',
          targetAlbumId: '',
          targetAlbumName: '',
          localPath: '',
          lastSyncTime: ''
        }
      }

      console.log('useConfigStore: config received', config)
      set({ config, persistedConfig: config, isLoading: false })
    } catch (e) {
      console.error('useConfigStore: error loading config', e)
      set({ isLoading: false })
    }
  },
  saveConfig: async () => {
    const { config } = get()
    const apiKeyMasked = config.apiKey ? '***' + config.apiKey.slice(-4) : ''
    console.log('useConfigStore: save-config invoke start', { targetAlbumId: config.targetAlbumId, apiKeyMasked })
    try {
      const result = await window.ipcRenderer.invoke('save-config', config)
      console.log('useConfigStore: save-config invoke complete', { result })
      set({ persistedConfig: { ...config } })
    } catch (e) {
      console.error('useConfigStore: save-config invoke error', e)
      throw e
    }
  }
})) 
