import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App.jsx'

// Auto-update: when a new build is deployed, activate it and reload immediately
// instead of waiting for the user to tap an "Update available" banner. This is
// what prevents the stale-cached-build problem (an old layout or old pay-period
// logic lingering on the device after a deploy).
function PwaAutoUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      const check = () => registration.update().catch(() => {})
      // Re-check for a newer build hourly, and whenever the app regains focus
      // (iOS PWAs don't reliably check on their own, so a long-open app would
      // otherwise sit on a stale build).
      setInterval(check, 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  useEffect(() => {
    // A new build is ready → activate it and reload. (skipWaiting/clientsClaim
    // are already on, so this swaps to the new assets in one reload.)
    if (needRefresh) updateServiceWorker(true)
  }, [needRefresh, updateServiceWorker])

  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PwaAutoUpdate />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
