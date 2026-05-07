import { getSupabaseBrowserClient } from '../../lib/supabase.js';

const EMPTY_CHAT_TITLE = 'New Chat';

function isPersistedId(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function normalizeAttachments(attachments) {
  return Array.isArray(attachments) ? attachments : [];
}

function normalizeQuestions(questions) {
  return Array.isArray(questions) ? questions : [];
}

function mapMessage(row) {
  return {
    id: row.id,
    role: row.role,
    text: normalizeVisibleChatText(row.content || ''),
    attachments: normalizeAttachments(row.attachments),
    questions: normalizeQuestions(row.questions),
  };
}

function normalizeVisibleChatText(text) {
  const raw = typeof text === 'string' ? text.trim() : '';
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/gi, ''));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.message === 'string') {
      return parsed.message.trim();
    }
  } catch {
    /* not a JSON envelope */
  }

  return text;
}

function mapConversation(row, messages = []) {
  return {
    id: row.id,
    title: row.title || EMPTY_CHAT_TITLE,
    messages,
  };
}

async function getCurrentUserId(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Sign in again to save AI chat conversations.');
  return userId;
}

export function createLocalChat(id) {
  return { id: `local-${id}`, title: EMPTY_CHAT_TITLE, messages: [] };
}

export function isPersistedChat(chat) {
  return isPersistedId(chat?.id);
}

export async function loadAiChatConversations() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId(supabase);

  const { data: conversations, error: conversationsError } = await supabase
    .from('ai_chat_conversations')
    .select('id, title, created_at, updated_at')
    .eq('profile_id', userId)
    .order('updated_at', { ascending: false });

  if (conversationsError) throw conversationsError;
  if (!conversations?.length) return [];

  const conversationIds = conversations.map((conversation) => conversation.id);
  const { data: messages, error: messagesError } = await supabase
    .from('ai_chat_messages')
    .select('id, conversation_id, role, content, attachments, questions, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const messagesByConversation = new Map();
  (messages || []).forEach((message) => {
    const list = messagesByConversation.get(message.conversation_id) || [];
    list.push(mapMessage(message));
    messagesByConversation.set(message.conversation_id, list);
  });

  return conversations.map((conversation) => (
    mapConversation(conversation, messagesByConversation.get(conversation.id) || [])
  ));
}

export async function createAiChatConversation(title = EMPTY_CHAT_TITLE) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId(supabase);

  const { data, error } = await supabase
    .from('ai_chat_conversations')
    .insert({
      profile_id: userId,
      title: title?.trim() || EMPTY_CHAT_TITLE,
    })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapConversation(data);
}

export async function ensureAiChatConversation(chat) {
  if (isPersistedChat(chat)) return chat;
  return createAiChatConversation(chat?.title || EMPTY_CHAT_TITLE);
}

export async function updateAiChatConversationTitle(id, title) {
  if (!isPersistedId(id)) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('ai_chat_conversations')
    .update({ title: title?.trim() || EMPTY_CHAT_TITLE })
    .eq('id', id);

  if (error) throw error;
}

export async function touchAiChatConversation(id) {
  if (!isPersistedId(id)) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('ai_chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteAiChatConversation(id) {
  if (!isPersistedId(id)) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('ai_chat_conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function appendAiChatMessage(conversationId, message) {
  if (!isPersistedId(conversationId)) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: typeof message.text === 'string' ? message.text : '',
      attachments: normalizeAttachments(message.attachments),
      questions: normalizeQuestions(message.questions),
    })
    .select('id, conversation_id, role, content, attachments, questions, created_at')
    .single();

  if (error) throw error;
  await touchAiChatConversation(conversationId);
  return mapMessage(data);
}
