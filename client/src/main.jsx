import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App.jsx'

function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      background: '#6C63FF', color: '#fff', padding: '10px 20px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999,
      fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: '500',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <span>Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{ background: '#fff', color: '#6C63FF', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}
      >
        Reload
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UpdateBanner />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
