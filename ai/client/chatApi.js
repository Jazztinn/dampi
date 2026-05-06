import { CHAT_SYSTEM_PROMPT } from '../config/prompts.js';

const API_PROXY = (import.meta.env.VITE_AI_PROXY_URL || 'http://localhost:3001').replace(/\/$/, '');

function normalizeMode(mode) {
  return mode === 'fast' || mode === 'auto' ? mode : 'default';
}

function normalizeSystemPrompt(systemPrompt) {
  if (typeof systemPrompt !== 'string') {
    return CHAT_SYSTEM_PROMPT;
  }

  const trimmed = systemPrompt.trim();
  return trimmed || CHAT_SYSTEM_PROMPT;
}

function normalizeAttachments(attachments = []) {
  return attachments.flatMap((attachment) => {
    if (!attachment || typeof attachment.mime !== 'string' || typeof attachment.data !== 'string') {
      return [];
    }

    return [{
      name: attachment.name,
      mime: attachment.mime,
      data: attachment.data,
    }];
  });
}

function normalizeMessages(messages = []) {
  return messages.flatMap((message) => {
    if (!message || (message.role !== 'assistant' && message.role !== 'user')) {
      return [];
    }

    return [{
      role: message.role,
      text: typeof message.text === 'string' ? message.text : '',
      attachments: normalizeAttachments(message.attachments),
    }];
  });
}

async function callChatApi(payload) {
  let response;

  try {
    response = await fetch(`${API_PROXY}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const error = new Error('AI backend is not running. Start it from ai/server with npm run dev.');
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function callAiChat(messages, userMessage, config = {}) {
  const purpose = config.purpose === 'title' ? 'title' : 'chat';

  const data = await callChatApi({
    messages: normalizeMessages(messages),
    userMessage: typeof userMessage === 'string' ? userMessage : '',
    attachments: normalizeAttachments(config.attachments),
    mode: normalizeMode(config.mode),
    purpose,
    systemPrompt: purpose === 'chat' ? normalizeSystemPrompt(config.systemPrompt) : '',
  });

  return purpose === 'title' ? data.text : data;
}
