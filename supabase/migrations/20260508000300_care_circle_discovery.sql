alter table public.profiles
  add column if not exists discoverable boolean not null default true,
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create table public.care_circle_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('family', 'caregiver')),
  child_id uuid references public.children(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_circle_requests_no_self check (requester_profile_id <> recipient_profile_id)
);

create index care_circle_requests_requester_idx
  on public.care_circle_requests (requester_profile_id, created_at desc);

create index care_circle_requests_recipient_idx
  on public.care_circle_requests (recipient_profile_id, created_at desc);

create unique index care_circle_requests_unique_pending_pair
  on public.care_circle_requests (
    least(requester_profile_id, recipient_profile_id),
    greatest(requester_profile_id, recipient_profile_id)
  )
  where status = 'pending';

create table public.care_circle_memberships (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  member_profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('family', 'caregiver')),
  created_from_request_id uuid references public.care_circle_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint care_circle_memberships_no_self check (owner_profile_id <> member_profile_id),
  constraint care_circle_memberships_unique unique (owner_profile_id, member_profile_id)
);

create unique index care_circle_memberships_unique_pair
  on public.care_circle_memberships (
    least(owner_profile_id, member_profile_id),
    greatest(owner_profile_id, member_profile_id)
  );

create trigger care_circle_requests_set_updated_at
  before update on public.care_circle_requests
  for each row
  execute function public.set_updated_at();

alter table public.care_circle_requests enable row level security;
alter table public.care_circle_memberships enable row level security;

create policy "Users can read their care circle requests"
  on public.care_circle_requests for select
  using (
    requester_profile_id = auth.uid()
    or recipient_profile_id = auth.uid()
  );

create policy "Users can read their care circle memberships"
  on public.care_circle_memberships for select
  using (
    owner_profile_id = auth.uid()
    or member_profile_id = auth.uid()
  );

alter table public.caregiver_access
  alter column invite_id drop not null,
  add column if not exists request_id uuid references public.care_circle_requests(id) on delete cascade;

alter table public.caregiver_access
  add constraint caregiver_access_has_source
  check (num_nonnulls(invite_id, request_id) = 1);

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

create or replace function public.search_care_circle_profiles(
  p_query text,
  p_limit integer default 12
)
returns table(
  id uuid,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
  digits text := regexp_replace(coalesce(p_query, ''), '[^0-9]', '', 'g');
  max_rows integer := least(greatest(coalesce(p_limit, 12), 1), 25);
begin
  if auth.uid() is null or q = '' then
    return;
  end if;

  return query
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where p.discoverable = true
    and public.care_circle_profile_is_available(p.id)
    and (
      (length(q) >= 2 and lower(p.full_name) like '%' || q || '%')
      or (position('@' in q) > 0 and lower(coalesce(p.email, '')) = q)
      or (length(digits) >= 7 and regexp_replace(p.phone, '[^0-9]', '', 'g') = digits)
    )
  order by
    case when lower(p.full_name) = q then 0 else 1 end,
    p.full_name asc
  limit max_rows;
end;
$$;

create or replace function public.suggest_care_circle_profiles(
  p_limit integer default 8
)
returns table(
  id uuid,
  full_name text,
  avatar_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.discoverable = true
    and public.care_circle_profile_is_available(p.id)
  order by p.created_at desc, p.full_name asc
  limit least(greatest(coalesce(p_limit, 8), 1), 25);
$$;

create or replace function public.send_care_circle_request(
  p_recipient_profile_id uuid,
  p_relationship_type text,
  p_child_id uuid default null
)
returns table(
  id uuid,
  requester_profile_id uuid,
  recipient_profile_id uuid,
  relationship_type text,
  child_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile_id uuid := auth.uid();
  inserted_request public.care_circle_requests%rowtype;
begin
  if current_profile_id is null then
    raise exception 'Sign in before sending a care-circle request.';
  end if;

  if p_recipient_profile_id = current_profile_id then
    raise exception 'You cannot add yourself to your care circle.';
  end if;

  if p_relationship_type not in ('family', 'caregiver') then
    raise exception 'Choose family or caregiver.';
  end if;

  if not exists (
    select 1 from public.profiles
    where profiles.id = p_recipient_profile_id
      and profiles.discoverable = true
  ) then
    raise exception 'This user is not available for care-circle search.';
  end if;

  if not public.care_circle_profile_is_available(p_recipient_profile_id) then
    raise exception 'This person is already linked or has a pending request.';
  end if;

  if p_child_id is not null and not exists (
    select 1 from public.children
    where children.id = p_child_id
      and children.primary_guardian_id = current_profile_id
  ) then
    raise exception 'You can only grant access to your own child.';
  end if;

  insert into public.care_circle_requests (
    requester_profile_id,
    recipient_profile_id,
    relationship_type,
    child_id
  )
  values (
    current_profile_id,
    p_recipient_profile_id,
    p_relationship_type,
    p_child_id
  )
  returning * into inserted_request;

  return query
  select
    inserted_request.id,
    inserted_request.requester_profile_id,
    inserted_request.recipient_profile_id,
    inserted_request.relationship_type,
    inserted_request.child_id,
    inserted_request.status,
    inserted_request.created_at;
end;
$$;

create or replace function public.respond_care_circle_request(
  p_request_id uuid,
  p_accept boolean
)
returns table(
  id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile_id uuid := auth.uid();
  request_row public.care_circle_requests%rowtype;
  next_status text := case when p_accept then 'accepted' else 'declined' end;
begin
  if current_profile_id is null then
    raise exception 'Sign in before responding to a care-circle request.';
  end if;

  select * into request_row
  from public.care_circle_requests
  where care_circle_requests.id = p_request_id
    and care_circle_requests.recipient_profile_id = current_profile_id
    and care_circle_requests.status = 'pending'
  for update;

  if not found then
    raise exception 'Request is no longer pending.';
  end if;

  update public.care_circle_requests
  set status = next_status,
      responded_at = now()
  where care_circle_requests.id = request_row.id;

  if p_accept then
    insert into public.care_circle_memberships (
      owner_profile_id,
      member_profile_id,
      relationship_type,
      created_from_request_id
    )
    values (
      current_profile_id,
      request_row.requester_profile_id,
      request_row.relationship_type,
      request_row.id
    )
    on conflict do nothing;

    if request_row.relationship_type = 'caregiver'
      and request_row.child_id is not null
      and exists (
        select 1 from public.children
        where children.id = request_row.child_id
          and children.primary_guardian_id = request_row.requester_profile_id
      )
    then
      insert into public.caregiver_access (
        caregiver_profile_id,
        child_id,
        guardian_profile_id,
        request_id
      )
      values (
        current_profile_id,
        request_row.child_id,
        request_row.requester_profile_id,
        request_row.id
      )
      on conflict (caregiver_profile_id, child_id) do nothing;
    end if;
  end if;

  return query select request_row.id, next_status;
end;
$$;

create or replace function public.get_care_circle_memberships()
returns table(
  id uuid,
  owner_profile_id uuid,
  member_profile_id uuid,
  relationship_type text,
  other_profile_id uuid,
  other_full_name text,
  other_avatar_url text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.id,
    m.owner_profile_id,
    m.member_profile_id,
    m.relationship_type,
    case
      when m.owner_profile_id = auth.uid() then m.member_profile_id
      else m.owner_profile_id
    end as other_profile_id,
    p.full_name as other_full_name,
    p.avatar_url as other_avatar_url,
    m.created_at
  from public.care_circle_memberships m
  join public.profiles p
    on p.id = case
      when m.owner_profile_id = auth.uid() then m.member_profile_id
      else m.owner_profile_id
    end
  where auth.uid() is not null
    and (m.owner_profile_id = auth.uid() or m.member_profile_id = auth.uid())
  order by m.created_at desc;
$$;

create or replace function public.get_care_circle_requests()
returns table(
  id uuid,
  direction text,
  requester_profile_id uuid,
  requester_full_name text,
  requester_avatar_url text,
  recipient_profile_id uuid,
  recipient_full_name text,
  recipient_avatar_url text,
  relationship_type text,
  child_id uuid,
  child_name text,
  status text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.id,
    case when r.recipient_profile_id = auth.uid() then 'incoming' else 'outgoing' end as direction,
    r.requester_profile_id,
    requester.full_name as requester_full_name,
    requester.avatar_url as requester_avatar_url,
    r.recipient_profile_id,
    recipient.full_name as recipient_full_name,
    recipient.avatar_url as recipient_avatar_url,
    r.relationship_type,
    r.child_id,
    ch.full_name as child_name,
    r.status,
    r.created_at
  from public.care_circle_requests r
  join public.profiles requester on requester.id = r.requester_profile_id
  join public.profiles recipient on recipient.id = r.recipient_profile_id
  left join public.children ch on ch.id = r.child_id
  where auth.uid() is not null
    and r.status = 'pending'
    and (r.requester_profile_id = auth.uid() or r.recipient_profile_id = auth.uid())
  order by r.created_at desc;
$$;

grant execute on function public.search_care_circle_profiles(text, integer) to authenticated;
grant execute on function public.suggest_care_circle_profiles(integer) to authenticated;
grant execute on function public.send_care_circle_request(uuid, text, uuid) to authenticated;
grant execute on function public.respond_care_circle_request(uuid, boolean) to authenticated;
grant execute on function public.get_care_circle_memberships() to authenticated;
grant execute on function public.get_care_circle_requests() to authenticated;
