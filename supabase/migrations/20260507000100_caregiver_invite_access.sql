-- Add secure token columns to caregiver_invites
alter table public.caregiver_invites
  add column invite_token uuid not null default gen_random_uuid(),
  add column token_expires_at timestamptz not null default (now() + interval '7 days');

create unique index caregiver_invites_token_idx
  on public.caregiver_invites (invite_token);

-- Replace the unique index that blocked re-inviting after revoke/accept
-- with a partial index that only enforces uniqueness on pending rows
drop index caregiver_invites_unique_pending_status_email;

create unique index caregiver_invites_unique_pending
  on public.caregiver_invites (inviter_profile_id, lower(invitee_email))
  where status = 'pending';

-- Allow invitees to read invites addressed to their own email
create policy "Invitees can read invites addressed to their email"
  on public.caregiver_invites for select
  using (
    lower(invitee_email) = lower((
      select email from auth.users where id = auth.uid()
    ))
  );

-- Caregiver access table — links accepted caregivers to children
create table public.caregiver_access (
  id uuid primary key default gen_random_uuid(),
  caregiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  guardian_profile_id uuid not null references public.profiles(id) on delete cascade,
  invite_id uuid not null references public.caregiver_invites(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint caregiver_access_unique unique (caregiver_profile_id, child_id)
);

alter table public.caregiver_access enable row level security;

-- Caregivers can see their own access rows (to show "Families I Care For")
create policy "Caregivers can read their own access rows"
  on public.caregiver_access for select
  using (caregiver_profile_id = auth.uid());

-- Guardians can see who has access to their children
create policy "Guardians can read access rows for their children"
  on public.caregiver_access for select
  using (guardian_profile_id = auth.uid());

-- Guardians can remove caregiver access (revoke)
create policy "Guardians can delete access for their children"
  on public.caregiver_access for delete
  using (guardian_profile_id = auth.uid());

-- Caregivers can read the children they have been granted access to
create policy "Caregivers can read children they are linked to"
  on public.children for select
  using (
    exists (
      select 1 from public.caregiver_access ca
      where ca.child_id = children.id
        and ca.caregiver_profile_id = auth.uid()
    )
  );

-- Security-definer RPC so unauthenticated users can preview an invite
-- (returns only safe fields — no token, no health data)
create function public.get_invite_preview(p_token uuid)
returns table(
  invitee_email text,
  guardian_name text,
  child_name text,
  status text,
  expired boolean
)
language sql
security definer
stable
as $$
  select
    ci.invitee_email,
    p.full_name  as guardian_name,
    ch.full_name as child_name,
    ci.status,
    ci.token_expires_at < now() as expired
  from public.caregiver_invites ci
  join public.profiles p on p.id = ci.inviter_profile_id
  left join public.children ch on ch.id = ci.child_id
  where ci.invite_token = p_token
  limit 1;
$$;

-- Let anonymous (unauthenticated) callers preview invite details
grant execute on function public.get_invite_preview(uuid) to anon;
