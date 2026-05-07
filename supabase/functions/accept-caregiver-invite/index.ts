import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Caregiver invite function is missing Supabase secrets.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Identify the calling user (the invitee)
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!body.token) {
    return new Response(JSON.stringify({ error: 'token is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Look up invite by token
  const { data: invite, error: inviteError } = await admin
    .from('caregiver_invites')
    .select('*')
    .eq('invite_token', body.token)
    .single()

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: 'Invalid or expired invitation link.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Must be addressed to the caller's email
  if (invite.invitee_email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return new Response(
      JSON.stringify({ error: 'This invitation was sent to a different email address.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Must still be pending
  if (invite.status !== 'pending') {
    return new Response(
      JSON.stringify({ error: `This invitation has already been ${invite.status}.` }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Must not have expired
  if (new Date(invite.token_expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: 'This invitation link has expired. Ask the guardian to resend it.' }),
      { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Ensure the invitee has a profile row (they may be brand-new via inviteUserByEmail)
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    await admin.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? '',
      email: user.email ?? '',
      phone: user.user_metadata?.phone ?? '',
      role: 'caregiver',
      onboarding_completed: false,
    })
  }

  // Create access row — ignore duplicate (idempotent accept)
  const { error: accessError } = await admin.from('caregiver_access').insert({
    caregiver_profile_id: user.id,
    child_id: invite.child_id,
    guardian_profile_id: invite.inviter_profile_id,
    invite_id: invite.id,
  })

  if (accessError && accessError.code !== '23505') {
    return new Response(JSON.stringify({ error: accessError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Mark invite as accepted
  await admin
    .from('caregiver_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return new Response(
    JSON.stringify({ ok: true, childId: invite.child_id, guardianId: invite.inviter_profile_id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
