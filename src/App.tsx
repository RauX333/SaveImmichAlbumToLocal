import { useEffect } from 'react'
import { useConfigStore } from './store/useConfigStore'
import { SetupWizard } from './components/SetupWizard'
import { Dashboard } from './components/Dashboard'

function App() {
  const { persistedConfig, loadConfig, isLoading } = useConfigStore()

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading configuration...</div>
  }

  const isConfigured = persistedConfig.immichUrl && persistedConfig.apiKey && persistedConfig.targetAlbumId && persistedConfig.localPath

  console.log('App: rendering, isConfigured:', isConfigured, 'persistedConfig:', persistedConfig)

  if (!isConfigured) {
    return <SetupWizard onComplete={() => loadConfig()} />
  }

  return <Dashboard />
}

export default App
