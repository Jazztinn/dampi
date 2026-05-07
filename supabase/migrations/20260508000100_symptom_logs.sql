create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  conversation_id uuid references public.ai_chat_conversations(id) on delete set null,
  status text not null default 'in_progress' check (status in ('in_progress', 'complete', 'abandoned')),
  summary jsonb,
  summary_text text,
  chief_complaint text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index symptom_logs_profile_child_idx
  on public.symptom_logs (profile_id, child_id, updated_at desc);

alter table public.symptom_logs enable row level security;

create policy "Users can select their own symptom logs"
  on public.symptom_logs for select using (profile_id = auth.uid());

create policy "Users can insert their own symptom logs"
  on public.symptom_logs for insert with check (profile_id = auth.uid());

create policy "Users can update their own symptom logs"
  on public.symptom_logs for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Users can delete their own symptom logs"
  on public.symptom_logs for delete using (profile_id = auth.uid());
