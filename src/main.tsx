import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Settings from './pages/Settings'
import { installConsoleBridge } from './utils/logger'

installConsoleBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
