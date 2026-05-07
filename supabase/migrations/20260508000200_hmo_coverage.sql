create table public.hmo_coverage (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  has_hmo boolean not null default false,
  provider_name text,
  benefits_tier text,
  benefits_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger hmo_coverage_set_updated_at
  before update on public.hmo_coverage
  for each row
  execute function public.set_updated_at();

alter table public.hmo_coverage enable row level security;

create policy "Users can select their own hmo coverage"
  on public.hmo_coverage for select
  using (profile_id = auth.uid());

create policy "Users can insert their own hmo coverage"
  on public.hmo_coverage for insert
  with check (profile_id = auth.uid());

create policy "Users can update their own hmo coverage"
  on public.hmo_coverage for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Users can delete their own hmo coverage"
  on public.hmo_coverage for delete
  using (profile_id = auth.uid());
