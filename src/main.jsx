import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const clearAppNotifications = async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready

    registration.active?.postMessage({
      type: 'CLEAR_NOTIFICATIONS',
    })
  } catch (error) {
    console.error('Notification cleanup error:', error)
  }
}

// Clear notifications when the app opens or returns to foreground
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    clearAppNotifications()
  }
})

window.addEventListener('pageshow', () => {
  clearAppNotifications()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)