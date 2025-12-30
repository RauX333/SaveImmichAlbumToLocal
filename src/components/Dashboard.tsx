import React, { useState, useEffect, useRef } from 'react'
import { useConfigStore } from '@/store/useConfigStore'
import { RefreshCw, Settings, Folder, Image, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const { config, loadConfig } = useConfigStore()
  const [syncing, setSyncing] = useState(false)
  const isMounted = useRef(true)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const onSyncComplete = async (_event: unknown, result: unknown) => {
      console.log('Dashboard: sync-complete received', result)
      if (isMounted.current) {
        setSyncing(false)
        await loadConfig()
      }
    }

    window.ipcRenderer.on('sync-complete', onSyncComplete)

    return () => {
      window.ipcRenderer.off('sync-complete', onSyncComplete)
    }
  }, [loadConfig])

  const handleSync = async () => {
    console.log('Dashboard: handleSync started')
    setSyncing(true)

    try {
      console.log('Dashboard: invoking start-sync')
      await window.ipcRenderer.invoke('start-sync')
      console.log('Dashboard: start-sync invoked successfully')
    } catch (error) {
      console.error('Dashboard: start-sync failed', error)
      setSyncing(false)
    }
  }

  const handleStopSync = async () => {
    console.log('Dashboard: handleStopSync started')
    try {
      await window.ipcRenderer.invoke('stop-sync')
      console.log('Dashboard: stop-sync invoked successfully')
    } catch (error) {
      console.error('Dashboard: stop-sync failed', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Immich Sync</h1>
          <button onClick={() => navigate('/settings')} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Settings">
            <Settings size={24} />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <Image size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Synced Album</h3>
                <p className="text-lg font-semibold text-gray-900">{config.targetAlbumName}</p>
                <p className="text-xs text-gray-400">{config.targetAlbumId}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <Folder size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Local Folder</h3>
                <p className="text-lg font-semibold text-gray-900 truncate max-w-xs" title={config.localPath}>
                  {config.localPath}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Sync</h3>
            <p className="text-gray-900">
              {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString() : 'Never'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {syncing && (
              <button 
                onClick={handleStopSync}
                className="flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-colors bg-red-600 hover:bg-red-700"
              >
                <XCircle size={20} />
                Stop
              </button>
            )}
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-colors
                ${syncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
