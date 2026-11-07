import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: userData, error: userError } =
      await userClient.auth.getUser()

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const subscription = body.subscription

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid push subscription' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { data: member, error: memberError } = await adminClient
      .from('members')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .not('membership_end', 'is', null)
      .gte('membership_end', new Date().toISOString().slice(0, 10))
      .maybeSingle()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'No active gym membership found' }),
        { status: 403, headers: corsHeaders }
      )
    }

    const { error: saveError } = await adminClient
      .from('push_subscriptions')
      .upsert(
        {
          member_id: member.id,
          subscription,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,subscription' }
      )

    if (saveError) {
      throw saveError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Save push subscription error:', error)

    return new Response(
      JSON.stringify({ error: 'Unable to save push subscription' }),
      { status: 500, headers: corsHeaders }
    )
  }
})