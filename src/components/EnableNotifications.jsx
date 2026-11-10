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
    <div className="notification-card">
  
      <div className="notification-card-header">
        <div className="notification-card-brand">
          <div className="notification-card-icon">
            🔔
          </div>
  
          <div>
            <p className="notification-eyebrow">
              BODY ENGINEERING
            </p>
            <h3>Studio Notifications</h3>
          </div>
        </div>
  
        <span
          className={`notification-status ${
            isEnabled ? "enabled" : "disabled"
          }`}
        >
          {isEnabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>
  
      <p className="notification-description">
        Receive important announcements and updates from
        Body Engineering.
      </p>
  
      <div className="notification-card-action">
        {isEnabled ? (
          <button
            type="button"
            className="notification-action-btn"
            onClick={handleDisableNotifications}
            disabled={loading}
          >
            {loading ? "Disabling..." : "Disable Notifications"}
          </button>
        ) : (
          <button
            type="button"
            className="notification-action-btn"
            onClick={handleEnableNotifications}
            disabled={loading}
          >
            {loading ? "Enabling..." : "Enable Notifications"}
          </button>
        )}
      </div>
  
      {message && (
        <p
          className="notification-message"
          role="status"
        >
          {message}
        </p>
      )}
  
    </div>
  )
}