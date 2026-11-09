import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function base64UrlToBytes(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + padding
  const binary = atob(base64)

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function convertVapidKeysToJWK(
  publicKey: string,
  privateKey: string
) {
  const publicBytes = base64UrlToBytes(publicKey)

  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error('Invalid VAPID public key.')
  }

  const x = bytesToBase64Url(publicBytes.slice(1, 33))
  const y = bytesToBase64Url(publicBytes.slice(33, 65))
  const d = bytesToBase64Url(base64UrlToBytes(privateKey))

  return {
    publicKey: {
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x,
      y,
      key_ops: ['verify'],
      ext: true,
    },
    privateKey: {
      kty: 'EC',
      crv: 'P-256',
      alg: 'ES256',
      x,
      y,
      d,
      key_ops: ['sign'],
      ext: true,
    },
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }

    for (const key of Object.getOwnPropertyNames(error)) {
      if (!(key in details)) {
        details[key] = (error as any)[key]
      }
    }

    return JSON.stringify(details)
  }

  if (error && typeof error === 'object') {
    const details: Record<string, unknown> = {}

    for (const key of Object.getOwnPropertyNames(error)) {
      try {
        details[key] = (error as any)[key]
      } catch {
        details[key] = '[Unable to read property]'
      }
    }

    return JSON.stringify(details)
  }

  return String(error)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { error: 'Method not allowed.' },
      405
    )
  }

  try {
    // 1. Verify logged-in user

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse(
        { error: 'Authentication required.' },
        401
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { data: userData, error: authError } =
      await userClient.auth.getUser()

    if (authError || !userData.user) {
      return jsonResponse(
        { error: 'Invalid user session.' },
        401
      )
    }

    const ownerId = userData.user.id

    // 2. Verify owner role

    const { data: profile, error: profileError } =
      await adminClient
        .from('profiles')
        .select('role')
        .eq('id', ownerId)
        .maybeSingle()

    if (profileError) throw profileError

    if (profile?.role !== 'owner') {
      return jsonResponse(
        { error: 'Only studio owners can send announcements.' },
        403
      )
    }

    // 3. Validate announcement

    const body = await req.json()

    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : ''

    if (!message) {
      return jsonResponse(
        { error: 'Please enter an announcement.' },
        400
      )
    }

    if (message.length > 1000) {
      return jsonResponse(
        { error: 'Announcement must be 1000 characters or fewer.' },
        400
      )
    }

    // 4. Check VAPID configuration

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID configuration is incomplete.')
    }

    // 5. Find this owner's active gym members

    const today = new Date().toISOString().slice(0, 10)

    const { data: members, error: membersError } =
      await adminClient
        .from('members')
        .select('id')
        .eq('owner_id', ownerId)
        .not('membership_end', 'is', null)
        .gte('membership_end', today)

    if (membersError) throw membersError

    const memberIds = (members || []).map(
      (member) => member.id
    )

    // 6. Find subscribed devices

    let devices: Array<{
      id: string
      member_id: string
      subscription: any
    }> = []

    if (memberIds.length > 0) {
      const { data: subscriptions, error: subscriptionError } =
        await adminClient
          .from('push_subscriptions')
          .select('id, member_id, subscription')
          .in('member_id', memberIds)

      if (subscriptionError) throw subscriptionError

      devices = subscriptions || []
    }

    // 7. Save announcement history

    const { data: notification, error: historyError } =
      await adminClient
        .from('studio_notifications')
        .insert({
          owner_id: ownerId,
          message,
          recipient_type: 'active_gym_members',
          recipient_count: devices.length,
          success_count: 0,
          failure_count: 0,
          status: 'pending',
        })
        .select('id')
        .single()

    if (historyError) throw historyError

    // 8. Handle zero subscribed devices

    if (devices.length === 0) {
      const { error: updateError } = await adminClient
        .from('studio_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id)

      if (updateError) throw updateError

      return jsonResponse({
        success: true,
        message:
          'Announcement saved. No active members currently have notifications enabled.',
        notification_id: notification.id,
        recipient_count: 0,
        success_count: 0,
        failure_count: 0,
        status: 'sent',
      })
    }

    // 9. Prepare Web Push server

    const exportedKeys = convertVapidKeysToJWK(
      vapidPublicKey,
      vapidPrivateKey
    )

    const vapidKeys = await webpush.importVapidKeys(
      exportedKeys,
      { extractable: false }
    )

    const appServer = await webpush.ApplicationServer.new({
      contactInformation: vapidSubject,
      vapidKeys,
    })

    // 10. Send notifications

    let successCount = 0
    let failureCount = 0

    const failureDetails: string[] = []

    for (const device of devices) {
      try {
        const subscription = device.subscription

        if (
          !subscription?.endpoint ||
          !subscription?.keys?.p256dh ||
          !subscription?.keys?.auth
        ) {
          throw new Error('Invalid saved push subscription.')
        }

        const subscriber = appServer.subscribe({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        })

        await subscriber.pushTextMessage(
          JSON.stringify({
            title: 'Body Engineering',
            body: message,
            url: '/member-login',
          }),
          {
            ttl: 86400,
            urgency: webpush.Urgency.High,
            topic: 'body-engineering',
          }
        )

        successCount++

     } catch (error) {
        failureCount++

        if (error instanceof webpush.PushMessageError) {
          const response = error.response
          const responseBody = await response.clone().text()

          const errorDetails = {
            name: error.name,
            http_status: response.status,
            http_status_text: response.statusText,
            response_body: responseBody,
          }

          console.error(
            'PUSH DELIVERY REJECTION:',
            JSON.stringify(errorDetails)
          )

          failureDetails.push(JSON.stringify(errorDetails))
        } else {
          const errorMessage = describeError(error)

          console.error(
            'PUSH INTERNAL ERROR:',
            errorMessage
          )

          failureDetails.push(errorMessage)
        }
      }
    }

    // 11. Determine final status

    const finalStatus =
      successCount === devices.length
        ? 'sent'
        : successCount > 0
          ? 'partial'
          : 'failed'

    // 12. Update notification history

    const { error: updateError } = await adminClient
      .from('studio_notifications')
      .update({
        recipient_count: devices.length,
        success_count: successCount,
        failure_count: failureCount,
        status: finalStatus,
        sent_at: new Date().toISOString(),
      })
      .eq('id', notification.id)

    if (updateError) throw updateError

    // 13. Return delivery results

    return jsonResponse({
      success: successCount > 0,
      notification_id: notification.id,
      recipient_count: devices.length,
      success_count: successCount,
      failure_count: failureCount,
      status: finalStatus,
      failure_details: failureDetails,
    })

  } catch (error) {
    const errorMessage = describeError(error)

    console.error(
      'SEND STUDIO NOTIFICATION ERROR:',
      errorMessage
    )

    return jsonResponse(
      {
        success: false,
        error: 'Unable to send studio announcement.',
        details: errorMessage,
      },
      500
    )
  }
})