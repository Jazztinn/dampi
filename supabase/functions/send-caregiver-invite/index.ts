import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_BASE_URL = Deno.env.get('APP_BASE_URL')!

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Identify calling user
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

  let body: { inviteId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!body.inviteId) {
    return new Response(JSON.stringify({ error: 'inviteId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Look up the invite using service role so we can read the token
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: invite, error: inviteError } = await admin
    .from('caregiver_invites')
    .select('*, children(full_name), profiles!inviter_profile_id(full_name)')
    .eq('id', body.inviteId)
    .single()

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: 'Invite not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify the calling user owns this invite
  if (invite.inviter_profile_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (invite.status !== 'pending') {
    return new Response(JSON.stringify({ error: `Cannot send email for an invite with status '${invite.status}'` }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const acceptUrl = `${APP_BASE_URL}?invite=${invite.invite_token}`
  const guardianName: string = (invite as any).profiles?.full_name ?? 'Someone'
  const childName: string = (invite as any).children?.full_name ?? 'a child'

  // Send invite email using Supabase built-in SMTP via inviteUserByEmail.
  // This creates (or re-sends to) the invitee's account and delivers a magic
  // link that redirects to our accept flow.
  const { error: emailError } = await admin.auth.admin.inviteUserByEmail(invite.invitee_email, {
    redirectTo: acceptUrl,
    data: {
      invited_by: guardianName,
      child_name: childName,
    },
  })

  if (emailError) {
    // inviteUserByEmail errors if the user already has a confirmed account.
    // In that case, fall back to a password-reset / magic-link so they can
    // still reach the accept flow without being blocked.
    if (emailError.message?.includes('already been registered') || emailError.code === 'email_exists') {
      const { error: otpError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: invite.invitee_email,
        options: { redirectTo: acceptUrl },
      })
      if (otpError) {
        return new Response(JSON.stringify({ error: otpError.message }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      return new Response(JSON.stringify({ error: emailError.message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
