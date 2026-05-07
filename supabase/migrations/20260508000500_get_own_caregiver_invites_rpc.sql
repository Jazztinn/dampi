create or replace function public.get_own_caregiver_invites()
returns table(
  id uuid,
  inviter_profile_id uuid,
  child_id uuid,
  invitee_email text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    ci.id,
    ci.inviter_profile_id,
    ci.child_id,
    ci.invitee_email,
    ci.status,
    ci.created_at,
    ci.updated_at
  from public.caregiver_invites ci
  where ci.inviter_profile_id = auth.uid()
  order by ci.created_at desc;
$$;

grant execute on function public.get_own_caregiver_invites() to authenticated;
