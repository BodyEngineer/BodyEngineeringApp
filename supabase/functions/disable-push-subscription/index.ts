import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    const endpoint = body.endpoint

    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription endpoint' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { data: member, error: memberError } = await adminClient
      .from('members')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Gym member not found' }),
        { status: 403, headers: corsHeaders }
      )
    }

    const { error: deleteError } = await adminClient
      .from('push_subscriptions')
      .delete()
      .eq('member_id', member.id)
      .filter('subscription->>endpoint', 'eq', endpoint)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Disable push subscription error:', error)

    return new Response(
      JSON.stringify({ error: 'Unable to disable notifications' }),
      { status: 500, headers: corsHeaders }
    )
  }
})