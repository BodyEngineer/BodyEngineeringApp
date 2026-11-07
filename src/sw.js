import {
    precacheAndRoute,
    cleanupOutdatedCaches,
  } from 'workbox-precaching'
  
  import { clientsClaim } from 'workbox-core'
  
  // Preserve PWA caching and update functionality
  self.skipWaiting()
  clientsClaim()
  cleanupOutdatedCaches()
  precacheAndRoute(self.__WB_MANIFEST)
  
  // Handle incoming push notifications
  self.addEventListener('push', (event) => {
    let data = {}
  
    try {
      data = event.data ? event.data.json() : {}
    } catch {
      data = {
        body: event.data ? event.data.text() : '',
      }
    }
  
    const title = data.title || 'Body Engineering'
  
    const options = {
      body: data.body || 'You have a new announcement.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        url: data.url || '/member-login',
      },
    }
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  })
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
  
    const targetUrl =
      event.notification.data?.url || '/member-login'
  
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      }).then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(targetUrl)
              }
            })
          }
        }
  
        return self.clients.openWindow(targetUrl)
      })
    )
  })