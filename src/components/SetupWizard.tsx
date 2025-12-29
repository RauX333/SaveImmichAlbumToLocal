import React, { useState } from 'react'
import { useConfigStore } from '@/store/useConfigStore'
import { Folder, AlertCircle, Loader2 } from 'lucide-react'

interface Album {
  id: string
  albumName: string
}

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { config, setConfig, saveConfig } = useConfigStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [albums, setAlbums] = useState<Album[]>([])

  const handleTestConnection = async () => {
    setLoading(true)
    setError('')
    try {
      const valid = await window.ipcRenderer.invoke('immich-validate', {
        url: config.immichUrl,
        apiKey: config.apiKey
      })
      if (valid) {
        // Fetch albums
        const albumsList = await window.ipcRenderer.invoke('immich-get-albums', {
          url: config.immichUrl,
          apiKey: config.apiKey
        })
        setAlbums(albumsList)
        setStep(2)
      } else {
        setError('Connection failed. Please check your URL and API Key.')
      }
    } catch (e) {
      setError('Connection error: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFolder = async () => {
    const path = await window.ipcRenderer.invoke('select-directory')
    if (path) {
      setConfig({ localPath: path })
    }
  }

  const handleFinish = async () => {
    const reqId = String(Date.now())
    const apiKeyMasked = config.apiKey ? '***' + config.apiKey.slice(-4) : ''
    console.log('SetupWizard: handleFinish start', { reqId, targetAlbumId: config.targetAlbumId, apiKeyMasked })
    setLoading(true)
    try {
      console.log('SetupWizard: calling saveConfig', { reqId })
      await saveConfig()
      console.log('SetupWizard: saveConfig succeeded', { reqId })
      const existing = await window.ipcRenderer.invoke('get-connections')
      const newId = Math.random().toString(36).slice(2, 10)
      const newConn = {
        id: newId,
        name: config.targetAlbumName || 'Immich',
        immichUrl: config.immichUrl || '',
        apiKey: config.apiKey || '',
        targetAlbumId: config.targetAlbumId || '',
        targetAlbumName: config.targetAlbumName || '',
        localPath: config.localPath || '',
        lastSyncTime: ''
      }
      const merged = Array.isArray(existing?.connections) ? [...existing.connections, newConn] : [newConn]
      await window.ipcRenderer.invoke('save-connections', { connections: merged, activeConnectionId: newId })
      console.log('SetupWizard: save-connections persisted', { reqId, activeConnectionId: newId })
    } catch (e) {
      console.error('SetupWizard: save-config failed', e)
      setError('Failed to save configuration: ' + String(e))
    } finally {
      setLoading(false)
      console.log('SetupWizard: finishing wizard', { reqId })
      onComplete()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Setup Immich Sync</h1>
        
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Immich Server URL</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="https://immich.example.com"
                value={config.immichUrl}
                onChange={e => setConfig({ immichUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={config.apiKey}
                onChange={e => setConfig({ apiKey: e.target.value })}
              />
            </div>
            {error && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
            <button 
              onClick={handleTestConnection}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Album to Sync</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={config.targetAlbumId}
                onChange={e => {
                  const album = albums.find(a => a.id === e.target.value)
                  setConfig({ 
                    targetAlbumId: e.target.value,
                    targetAlbumName: album?.albumName || 'Unknown Album'
                  })
                }}
              >
                <option value="">Select an album...</option>
                {albums.map(album => (
                  <option key={album.id} value={album.id}>{album.albumName}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Local Download Folder</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  readOnly 
                  className="block w-full rounded-md border-gray-300 bg-gray-50 sm:text-sm p-2 border"
                  value={config.localPath}
                />
                <button 
                  onClick={handleSelectFolder}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <Folder size={16} />
                </button>
              </div>
            </div>

            <button 
              onClick={handleFinish}
              disabled={!config.targetAlbumId || !config.localPath}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
            >
              Finish Setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
