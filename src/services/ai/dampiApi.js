import { CHAT_SYSTEM_PROMPT } from '../../constants/dampiAi.js';
import * as GeminiApi from './geminiApi.js';

const API_PROXY = (import.meta.env.VITE_AI_PROXY_URL || '').replace(/\/$/, '');
const USE_GEMINI_DIRECT = !API_PROXY && import.meta.env.VITE_AI_API_KEY;

// For GitHub Pages or when no local proxy is available, use direct Gemini API
if (USE_GEMINI_DIRECT) {
  console.log('Using direct Gemini API for AI calls');
}

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
    const error = new Error('Backend not running. Start both dev servers with `just dev`.');
    error.isNetworkError = true;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    throw error;
  }

  const data = await response.json();
  return data;
}

async function streamChatApi(payload, onEvent, signal) {
  let response;

  try {
    response = await fetch(`${API_PROXY}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (caughtError) {
    if (caughtError?.name === 'AbortError') {
      throw caughtError;
    }
    const networkError = new Error('Backend not running. Start both dev servers with `just dev`.');
    networkError.isNetworkError = true;
    throw networkError;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    throw error;
  }

  if (!response.body) {
    throw new Error('Streaming is not supported by this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalData = null;

  const emitLines = (text) => {
    buffer += text;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const event = JSON.parse(trimmed);

      if (event.type === 'text') {
        onEvent?.(event);
      } else if (event.type === 'done') {
        finalData = event.data;
      } else if (event.type === 'error') {
        throw new Error(event.error || 'Chat request failed');
      }
    });
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    emitLines(decoder.decode(value, { stream: true }));
  }

  emitLines(decoder.decode());

  if (buffer.trim()) {
    emitLines('\n');
  }

  if (!finalData) {
    throw new Error('Stream ended without a final response.');
  }

  return finalData;
}

export async function callDampiChat(messages, userMessage, config = {}) {
  if (USE_GEMINI_DIRECT) {
    return GeminiApi.callGeminiChat(messages, userMessage, config);
  }

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

export async function transcribeDampiAudio(attachment) {
  if (USE_GEMINI_DIRECT) {
    return GeminiApi.transcribeGeminiAudio(attachment);
  }

  const data = await callChatApi({
    messages: [],
    userMessage: 'Transcribe this audio exactly. Return only the spoken words. If there is no clear speech, return an empty string.',
    attachments: normalizeAttachments([attachment]),
    mode: 'fast',
    purpose: 'transcription',
    systemPrompt: '',
  });

  return typeof data.text === 'string' ? data.text.trim() : '';
}

export async function streamDampiChat(messages, userMessage, config = {}) {
  if (USE_GEMINI_DIRECT) {
    return GeminiApi.streamGeminiChat(messages, userMessage, config);
  }

  const data = await streamChatApi({
    messages: normalizeMessages(messages),
    userMessage: typeof userMessage === 'string' ? userMessage : '',
    attachments: normalizeAttachments(config.attachments),
    mode: normalizeMode(config.mode),
    purpose: 'chat',
    systemPrompt: normalizeSystemPrompt(config.systemPrompt),
  }, config.onEvent, config.signal);

  return data;
}
