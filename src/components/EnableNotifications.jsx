import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  )
}

export default function EnableNotifications({ memberType }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkSubscription() {
      try {
        if (
          !('serviceWorker' in navigator) ||
          !('PushManager' in window)
        ) return

        const registration = await navigator.serviceWorker.ready
        const subscription =
          await registration.pushManager.getSubscription()

        if (mounted) {
          const enabled = Boolean(
            subscription && Notification.permission === 'granted'
          )

          setIsEnabled(enabled)
          setMessage(
            enabled
              ? 'Notifications are active on this device.'
              : ''
          )
        }
      } catch (error) {
        console.error('Subscription check error:', error)
      }
    }

    if (memberType === 'gym') {
      checkSubscription()
    }

    return () => {
      mounted = false
    }
  }, [memberType])

  if (memberType !== 'gym') return null

  const handleEnableNotifications = async () => {
    try {
      setLoading(true)
      setMessage('')

      if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        throw new Error('Push notifications are not supported.')
      }

      if (!window.isSecureContext) {
        throw new Error('Please open the HTTPS version of the app.')
      }

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

      if (!publicKey) {
        throw new Error('VAPID public key is not configured.')
      }

      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.')
      }

      const registration = await navigator.serviceWorker.ready

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      const { data, error } = await supabase.functions.invoke(
        'save-push-subscription',
        {
          body: {
            subscription: subscription.toJSON(),
          },
        }
      )

      if (error) throw error

      if (!data?.success) {
        throw new Error(
          data?.error || 'Unable to save device subscription.'
        )
      }

      setIsEnabled(true)
      setMessage('Notifications are active on this device.')

    } catch (error) {
      console.error('Enable notifications error:', error)
      setMessage(error.message || 'Unable to enable notifications.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disable studio notifications on this device?'
      )
    ) return

    try {
      setLoading(true)
      setMessage('')

      const registration = await navigator.serviceWorker.ready
      const subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        setIsEnabled(false)
        setMessage('Notifications are already disabled.')
        return
      }

      const endpoint = subscription.endpoint

      // First unsubscribe this browser/device.
      const unsubscribed = await subscription.unsubscribe()

      if (!unsubscribed) {
        throw new Error('Unable to disable notifications on this device.')
      }

      setIsEnabled(false)

      // Remove this device's saved subscription from Supabase.
      const { data, error } = await supabase.functions.invoke(
        'disable-push-subscription',
        {
          body: { endpoint },
        }
      )

      if (error) throw error

      if (!data?.success) {
        throw new Error(
          data?.error || 'Device disabled, but server cleanup failed.'
        )
      }

      setMessage('Notifications disabled successfully on this device.')

    } catch (error) {
      console.error('Disable notifications error:', error)
      setMessage(
        error.message || 'Unable to disable notifications completely.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="coaching-card notification-settings-card"
      style={{ cursor: 'default' }}
    >
      <div className="coaching-card-top">
        <div className="coaching-card-icon">
          🔔
        </div>

        <span className="coaching-card-badge">
          {isEnabled ? 'ENABLED' : 'SETTINGS'}
        </span>
      </div>

      <div className="coaching-card-content">
        <h3>Studio Notifications</h3>

        <p>
          Receive important announcements and updates from
          Body Engineering.
        </p>

        <div style={{ marginTop: '16px' }}>
          {isEnabled ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDisableNotifications}
              disabled={loading}
            >
              {loading ? 'Disabling...' : 'Disable Notifications'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEnableNotifications}
              disabled={loading}
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>
        <button
  type="button"
  className="btn btn-primary"
  style={{ marginTop: '12px' }}
  onClick={async () => {
    try {
      const registration =
        await navigator.serviceWorker.ready

      await registration.showNotification(
        'Body Engineering Test',
        {
          body: 'Your iPhone notification display is working!',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        }
      )

      setMessage('Local notification test triggered.')
    } catch (error) {
      console.error('Local notification test:', error)
      setMessage(error.message)
    }
  }}
>
  Test Notification Display
</button>
        {message && (
          <p
            role="status"
            style={{ marginTop: '12px', fontSize: '13px' }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}