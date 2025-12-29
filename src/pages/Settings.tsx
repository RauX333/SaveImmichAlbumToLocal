import { ArrowLeft, Plus, Trash2, CheckCircle, RefreshCw, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useConnectionsStore, ConnectionConfig } from '@/store/useConnectionsStore'

export default function Settings() {
  const navigate = useNavigate()
  const {
    connections,
    activeConnectionId,
    isLoading,
    addConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,
    loadConnections,
    saveConnections
  } = useConnectionsStore()
  const [logs, setLogs] = useState<string>('')
  const [logsLoading, setLogsLoading] = useState(false)
  interface Album { id: string; albumName: string }
  const [albumsByConn, setAlbumsByConn] = useState<Record<string, Album[]>>({})
  const [connLoading, setConnLoading] = useState<Record<string, boolean>>({})
  const [connError, setConnError] = useState<Record<string, string>>({})

  useEffect(() => {
    loadConnections()
  }, [loadConnections])
  useEffect(() => {
    loadLogs()
    const id = setInterval(() => {
      loadLogs()
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const handleAdd = () => {
    addConnection({
      name: 'New Connection',
      immichUrl: '',
      apiKey: '',
      targetAlbumId: '',
      targetAlbumName: '',
      localPath: ''
    })
  }

  const handleSaveAll = async () => {
    await saveConnections()
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const content = await window.ipcRenderer.invoke('get-logs')
      setLogs(String(content || ''))
    } finally {
      setLogsLoading(false)
    }
  }

  const testAndLoadAlbums = async (c: ConnectionConfig) => {
    setConnLoading((prev) => ({ ...prev, [c.id]: true }))
    setConnError((prev) => ({ ...prev, [c.id]: '' }))
    try {
      const valid = await window.ipcRenderer.invoke('immich-validate', {
        url: c.immichUrl,
        apiKey: c.apiKey
      })
      if (!valid) {
        setConnError((prev) => ({ ...prev, [c.id]: 'Connection failed. Check URL and API Key.' }))
        setAlbumsByConn((prev) => ({ ...prev, [c.id]: [] }))
        return
      }
      const albums: Album[] = await window.ipcRenderer.invoke('immich-get-albums', {
        url: c.immichUrl,
        apiKey: c.apiKey
      })
      setAlbumsByConn((prev) => ({ ...prev, [c.id]: Array.isArray(albums) ? albums : [] }))
    } catch (e) {
      setConnError((prev) => ({ ...prev, [c.id]: 'Error: ' + String(e) }))
      setAlbumsByConn((prev) => ({ ...prev, [c.id]: [] }))
    } finally {
      setConnLoading((prev) => ({ ...prev, [c.id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button
            className="p-2 rounded hover:bg-gray-200"
            aria-label="Back"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
              <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <Plus size={18} />
                Add
              </button>
            </div>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : connections.length === 0 ? (
              <p className="text-gray-500">No connections. Add one to get started.</p>
            ) : (
              <div className="space-y-4">
                {connections.map((c) => (
                  <div key={c.id} className="border rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        className="text-lg font-semibold text-gray-900 bg-transparent outline-none w-full"
                        value={c.name}
                        onChange={(e) => updateConnection(c.id, { name: e.target.value })}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          className={`px-2 py-1 rounded text-sm ${activeConnectionId === c.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                          onClick={() => setActiveConnection(c.id)}
                          title="Set Active"
                        >
                          <div className="flex items-center gap-1">
                            <CheckCircle size={16} />
                            {activeConnectionId === c.id ? 'Active' : 'Set Active'}
                          </div>
                        </button>
                        <button className="p-2 rounded hover:bg-red-50 text-red-600" onClick={() => removeConnection(c.id)} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-sm text-gray-600">
                        Immich URL
                        <input
                          className="mt-1 w-full border rounded px-2 py-1"
                          value={c.immichUrl}
                          onChange={(e) => updateConnection(c.id, { immichUrl: e.target.value })}
                          placeholder="https://immich.example.com"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        API Key
                        <input
                          className="mt-1 w-full border rounded px-2 py-1"
                          value={c.apiKey}
                          onChange={(e) => updateConnection(c.id, { apiKey: e.target.value })}
                          placeholder="••••••••"
                        />
                      </label>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <button
                          onClick={() => testAndLoadAlbums(c)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-black"
                          disabled={!!connLoading[c.id]}
                          title="Test connection and load albums"
                        >
                          <RefreshCw size={16} className={connLoading[c.id] ? 'animate-spin' : ''} />
                          {connLoading[c.id] ? 'Testing...' : 'Test & Load Albums'}
                        </button>
                        {connError[c.id] && <span className="text-sm text-red-600">{connError[c.id]}</span>}
                      </div>
                      <label className="text-sm text-gray-600 md:col-span-2">
                        Local Folder
                        <input
                          className="mt-1 w-full border rounded px-2 py-1"
                          value={c.localPath}
                          onChange={(e) => updateConnection(c.id, { localPath: e.target.value })}
                          placeholder="/Users/you/Pictures"
                        />
                      </label>
                      <label className="text-sm text-gray-600 md:col-span-2">
                        Album
                        <select
                          className="mt-1 w-full border rounded px-2 py-1"
                          value={c.targetAlbumId}
                          onChange={(e) => {
                            const list = albumsByConn[c.id] || []
                            const album = list.find((a: Album) => a.id === e.target.value)
                            updateConnection(c.id, {
                              targetAlbumId: e.target.value,
                              targetAlbumName: album?.albumName || 'Unknown Album'
                            })
                          }}
                          disabled={!albumsByConn[c.id] || (albumsByConn[c.id] || []).length === 0}
                        >
                          <option value="">
                            {albumsByConn[c.id] && (albumsByConn[c.id] || []).length > 0
                              ? 'Select an album...'
                              : 'Run Test & Load Albums to fetch'}
                          </option>
                          {(albumsByConn[c.id] || []).map((album: Album) => (
                            <option key={album.id} value={album.id}>
                              {album.albumName}
                            </option>
                          ))}
                        </select>
                        {c.targetAlbumName && (
                          <div className="text-xs text-gray-500 mt-1">
                            Selected: {c.targetAlbumName} ({c.targetAlbumId})
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Sync: {c.lastSyncTime ? new Date(c.lastSyncTime).toLocaleString() : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                title="Save all changes"
              >
                Save Changes
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Logs</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadLogs}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-black"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
            <div className="border rounded bg-gray-50">
              <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-100 text-gray-700">
                <FileText size={16} />
                App Log
              </div>
              <div className="max-h-[480px] overflow-auto p-3 font-mono text-sm whitespace-pre-wrap">
                {logsLoading ? <p className="text-gray-500">Loading logs...</p> : logs || <p className="text-gray-500">No logs yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
