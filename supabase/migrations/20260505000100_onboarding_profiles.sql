create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  role text not null default 'parent_guardian',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  primary_guardian_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.caregiver_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  invitee_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index caregiver_invites_unique_pending_status_email
  on public.caregiver_invites (inviter_profile_id, lower(invitee_email), status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger children_set_updated_at
  before update on public.children
  for each row
  execute function public.set_updated_at();

create trigger caregiver_invites_set_updated_at
  before update on public.caregiver_invites
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.caregiver_invites enable row level security;

create policy "Users can select their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can select their own children"
  on public.children for select
  using (primary_guardian_id = auth.uid());

create policy "Users can insert their own children"
  on public.children for insert
  with check (primary_guardian_id = auth.uid());

create policy "Users can update their own children"
  on public.children for update
  using (primary_guardian_id = auth.uid())
  with check (primary_guardian_id = auth.uid());

create policy "Users can delete their own children"
  on public.children for delete
  using (primary_guardian_id = auth.uid());

create policy "Users can select their own caregiver invites"
  on public.caregiver_invites for select
  using (inviter_profile_id = auth.uid());

create policy "Users can insert their own caregiver invites"
  on public.caregiver_invites for insert
  with check (inviter_profile_id = auth.uid());

create policy "Users can update their own caregiver invites"
  on public.caregiver_invites for update
  using (inviter_profile_id = auth.uid())
  with check (inviter_profile_id = auth.uid());

create policy "Users can delete their own caregiver invites"
  on public.caregiver_invites for delete
  using (inviter_profile_id = auth.uid());
