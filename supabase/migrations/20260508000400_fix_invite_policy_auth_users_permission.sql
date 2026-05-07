drop policy if exists "Invitees can read invites addressed to their email"
  on public.caregiver_invites;

create policy "Invitees can read invites addressed to their email"
  on public.caregiver_invites for select
  using (
    lower(invitee_email) = lower(auth.jwt() ->> 'email')
  );

create or replace function public.care_circle_profile_is_available(p_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_profile_id <> auth.uid()
    and not exists (
      select 1 from public.care_circle_memberships m
      where (m.owner_profile_id = auth.uid() and m.member_profile_id = p_profile_id)
         or (m.owner_profile_id = p_profile_id and m.member_profile_id = auth.uid())
    )
    and not exists (
      select 1 from public.care_circle_requests r
      where r.status = 'pending'
        and (
          (r.requester_profile_id = auth.uid() and r.recipient_profile_id = p_profile_id)
          or (r.requester_profile_id = p_profile_id and r.recipient_profile_id = auth.uid())
        )
    );
$$;
