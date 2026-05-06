create table public.ai_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index ai_chat_conversations_profile_updated_idx
  on public.ai_chat_conversations (profile_id, updated_at desc);

create index ai_chat_messages_conversation_created_idx
  on public.ai_chat_messages (conversation_id, created_at asc);

create trigger ai_chat_conversations_set_updated_at
  before update on public.ai_chat_conversations
  for each row
  execute function public.set_updated_at();

alter table public.ai_chat_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;

create policy "Users can select their own AI chat conversations"
  on public.ai_chat_conversations for select
  using (profile_id = auth.uid());

create policy "Users can insert their own AI chat conversations"
  on public.ai_chat_conversations for insert
  with check (profile_id = auth.uid());

create policy "Users can update their own AI chat conversations"
  on public.ai_chat_conversations for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Users can delete their own AI chat conversations"
  on public.ai_chat_conversations for delete
  using (profile_id = auth.uid());

create policy "Users can select messages from their own AI chats"
  on public.ai_chat_messages for select
  using (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Users can insert messages into their own AI chats"
  on public.ai_chat_messages for insert
  with check (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Users can update messages from their own AI chats"
  on public.ai_chat_messages for update
  using (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
        and c.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Users can delete messages from their own AI chats"
  on public.ai_chat_messages for delete
  using (
    exists (
      select 1
      from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
        and c.profile_id = auth.uid()
    )
  );
