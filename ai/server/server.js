import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

[
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env'),
].forEach((envPath) => {
  dotenv.config({ path: envPath, override: false });
});

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3001;
const PROVIDER_API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const AVAILABLE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro-latest',
];

const FAST_MODELS = AVAILABLE_MODELS.slice(0, 3);
const FULL_MODELS = ['gemini-1.5-pro', 'gemini-pro-latest', 'gemini-1.5-flash', 'gemini-2.0-flash'];
const VALID_MODES = new Set(['fast', 'auto', 'default']);
const VALID_PURPOSES = new Set(['chat', 'title']);
const STRUCTURED_CHAT_SCHEMA = {
  type: 'OBJECT',
  required: ['message', 'createTasks', 'askQuestions'],
  propertyOrdering: ['message', 'createTasks', 'askQuestions', 'generateSummary'],
  properties: {
    message: {
      type: 'STRING',
    },
    createTasks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['title', 'date'],
        propertyOrdering: ['title', 'date', 'time', 'desc', 'tag'],
        properties: {
          title: { type: 'STRING' },
          date: { type: 'STRING' },
          time: { type: 'STRING' },
          desc: { type: 'STRING' },
          tag: {
            type: 'STRING',
            enum: ['Billing', 'Technical', 'General', 'Urgent', 'Other'],
          },
        },
      },
    },
    askQuestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['question'],
        propertyOrdering: ['id', 'question', 'options', 'allowFreeText', 'inputPlaceholder'],
        properties: {
          id: { type: 'STRING' },
          question: { type: 'STRING' },
          options: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          allowFreeText: { type: 'BOOLEAN' },
          inputPlaceholder: { type: 'STRING' },
        },
      },
    },
    generateSummary: {
      type: 'OBJECT',
      properties: {
        chief_complaint: { type: 'STRING' },
        history_of_present_illness: { type: 'STRING' },
        associated_symptoms: { type: 'ARRAY', items: { type: 'STRING' } },
        onset_and_duration: { type: 'STRING' },
        aggravating_factors: { type: 'ARRAY', items: { type: 'STRING' } },
        relieving_factors: { type: 'ARRAY', items: { type: 'STRING' } },
        vital_signs: {
          type: 'OBJECT',
          properties: {
            temperature: { type: 'STRING' },
            breathing: { type: 'STRING' },
            hydration: { type: 'STRING' },
          },
        },
        medications_taken: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              dose: { type: 'STRING' },
              frequency: { type: 'STRING' },
              last_taken: { type: 'STRING' },
            },
          },
        },
        allergies: { type: 'STRING' },
        past_medical_history: { type: 'STRING' },
        red_flags_noted: { type: 'ARRAY', items: { type: 'STRING' } },
        parent_concerns: { type: 'STRING' },
        ai_triage_note: { type: 'STRING' },
      },
    },
  },
};

function isComplexPrompt(text) {
  if (!text) return false;

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 80) return true;

  return /\b(explain|analyze|compare|summarize|essay|detail|research|step.by.step|write me)\b/i.test(text);
}

function normalizeMode(mode) {
  return VALID_MODES.has(mode) ? mode : 'default';
}

function normalizePurpose(purpose) {
  return VALID_PURPOSES.has(purpose) ? purpose : 'chat';
}

function normalizeSystemPrompt(systemPrompt) {
  return typeof systemPrompt === 'string' ? systemPrompt.trim() : '';
}

function getAttachmentParts(attachments = []) {
  return attachments.flatMap((attachment) => {
    if (!attachment || typeof attachment.mime !== 'string' || typeof attachment.data !== 'string') {
      return [];
    }

    return [{
      inline_data: {
        mime_type: attachment.mime,
        data: attachment.data,
      },
    }];
  });
}

function getMessageParts(message = {}) {
  const parts = [];
  const text = typeof message.text === 'string' ? message.text.trim() : '';

  if (text) {
    parts.push({ text });
  }

  if (message.role !== 'assistant') {
    parts.push(...getAttachmentParts(message.attachments));
  }

  return parts;
}

function buildContents(messages = [], userMessage, attachments = []) {
  const history = messages.flatMap((message) => {
    const parts = getMessageParts(message);

    if (!parts.length) {
      return [];
    }

    return [{
      role: message.role === 'assistant' ? 'model' : 'user',
      parts,
    }];
  });

  const nextParts = [];
  const text = typeof userMessage === 'string' ? userMessage.trim() : '';
  const attachmentParts = getAttachmentParts(attachments);

  if (text) {
    nextParts.push({ text });
  } else if (attachmentParts.length > 0) {
    nextParts.push({ text: 'Describe the attached file(s).' });
  }

  nextParts.push(...attachmentParts);

  if (!nextParts.length) {
    return history;
  }

  return [...history, { role: 'user', parts: nextParts }];
}

function isSymptomLogRequest(userMessage, systemPrompt) {
  const combined = `${userMessage}\n${systemPrompt}`;
  return combined.includes('EXAM_SYSTEM_PROMPT') || 
         combined.includes('SUMMARY_SYSTEM_PROMPT') || 
         combined.includes('instructions":') || 
         combined.includes('chiefComplaint":') ||
         combined.includes('pediatric triage assistant');
}

function getModelsForMode(mode, prompt, purpose) {
  if (purpose === 'title') {
    return FAST_MODELS;
  }

  if (mode === 'fast') {
    return FAST_MODELS;
  }

  if (mode === 'auto') {
    return isComplexPrompt(prompt) ? FULL_MODELS : FAST_MODELS;
  }

  return AVAILABLE_MODELS;
}

function getGenerationConfig(mode, prompt, purpose, systemPrompt = '') {
  if (purpose === 'title') {
    return {
      maxOutputTokens: 20,
      temperature: 0.3,
    };
  }

  const useFastProfile = mode === 'fast' || (mode === 'auto' && !isComplexPrompt(prompt));
  const isSymptomLog = isSymptomLogRequest(prompt, systemPrompt);

  const generationConfig = {
    maxOutputTokens: (useFastProfile && !isSymptomLog) ? 600 : 2048,
    temperature: useFastProfile ? 0.5 : 0.8,
  };

  if (purpose === 'chat') {
    // Only apply the default schema if we aren't in a specialized Symptom Log flow.
    // specialised flows define their own structure in their system prompts.
    if (!isSymptomLog) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = STRUCTURED_CHAT_SCHEMA;
    } else {
      // Still enforce JSON mode for reliability, but let the prompt guide the schema
      generationConfig.responseMimeType = 'application/json';
    }
  }

  return generationConfig;
}

function stripJsonFence(text) {
  const trimmed = String(text || '').trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function normalizeStructuredChatResponse(rawText) {
  try {
    const parsed = JSON.parse(stripJsonFence(rawText));

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Structured response was not an object');
    }

    const message = typeof parsed.message === 'string' ? parsed.message.trim() : '';

    const taskActions = {
      createTasks: Array.isArray(parsed.createTasks) ? parsed.createTasks : [],
      askQuestions: Array.isArray(parsed.askQuestions) ? parsed.askQuestions : [],
    };

    if (parsed.generateSummary && typeof parsed.generateSummary === 'object') {
      taskActions.generateSummary = parsed.generateSummary;
    }

    return { text: message || 'Done.', taskActions };
  } catch {
    return {
      text: typeof rawText === 'string' ? rawText : '',
      taskActions: {
        createTasks: [],
        askQuestions: [],
      },
    };
  }
}

function extractCandidateText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('') || '';
}

function decodeJsonStringPrefix(value) {
  let output = '';

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char === '"') {
      break;
    }

    if (char !== '\\') {
      output += char;
      continue;
    }

    if (i + 1 >= value.length) {
      break;
    }

    const escape = value[i + 1];
    i += 1;

    if (escape === '"' || escape === '\\' || escape === '/') {
      output += escape;
    } else if (escape === 'b') {
      output += '\b';
    } else if (escape === 'f') {
      output += '\f';
    } else if (escape === 'n') {
      output += '\n';
    } else if (escape === 'r') {
      output += '\r';
    } else if (escape === 't') {
      output += '\t';
    } else if (escape === 'u') {
      const hex = value.slice(i + 1, i + 5);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        output += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        break;
      }
    } else {
      output += escape;
    }
  }

  return output;
}

function extractMessagePrefix(rawText) {
  const text = stripJsonFence(rawText);
  const keyMatch = /"message"\s*:\s*"/.exec(text);

  if (!keyMatch) {
    return /^\s*[{[]/.test(text) ? '' : text;
  }

  return decodeJsonStringPrefix(text.slice(keyMatch.index + keyMatch[0].length));
}

function parseSseChunk(chunk, onData) {
  const events = chunk.split(/\r?\n\r?\n/);
  const remainder = events.pop() || '';

  events.forEach((event) => {
    const dataLines = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length > 0) {
      onData(dataLines.join('\n'));
    }
  });

  return remainder;
}

function sendStreamEvent(res, event) {
  res.write(`${JSON.stringify(event)}\n`);
}

async function callProviderModel(model, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${PROVIDER_API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json();

    if (!response.ok) {
      const message = data.error?.message || 'API error';
      const error = new Error(message);
      error.status = response.status;
      error.isModelError = response.status === 404 || message.toLowerCase().includes('not found');
      throw error;
    }

    const text = extractCandidateText(data);

    if (!text) {
      const error = new Error('No text in response');
      error.status = 500;
      throw error;
    }

    return { text, model };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function streamProviderModel(model, payload, res) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${PROVIDER_API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data.error?.message || 'API error';
      const error = new Error(message);
      error.status = response.status;
      error.isModelError = response.status === 404 || message.toLowerCase().includes('not found');
      throw error;
    }

    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
    }

    const isSymptomLog = isSymptomLogRequest(payload.contents[payload.contents.length - 1]?.parts?.[0]?.text || '', payload.systemInstruction?.parts?.[0]?.text || '');
    let buffer = '';
    let rawText = '';
    let streamedMessage = '';
    const decoder = new TextDecoder();

    const handleData = (eventData) => {
      if (eventData === '[DONE]') return;

      const data = JSON.parse(eventData);
      const newText = extractCandidateText(data);
      rawText += newText;

      if (isSymptomLog) {
        // For symptom log, just stream the raw text delta
        sendStreamEvent(res, { type: 'text', text: newText });
      } else {
        const nextMessage = extractMessagePrefix(rawText);
        if (nextMessage.length > streamedMessage.length) {
          const delta = nextMessage.slice(streamedMessage.length);
          streamedMessage = nextMessage;
          sendStreamEvent(res, { type: 'text', text: delta });
        }
      }
    };

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      buffer = parseSseChunk(buffer, handleData);
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      parseSseChunk(`${buffer}\n\n`, handleData);
    }

    if (isSymptomLog) {
      sendStreamEvent(res, {
        type: 'done',
        data: {
          text: rawText,
          model,
        },
      });
    } else {
      sendStreamEvent(res, {
        type: 'done',
        data: {
          ...normalizeStructuredChatResponse(rawText),
          model,
        },
      });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function streamModelWithFallback(payload, models, res) {
  let lastError = null;

  for (const model of models) {
    try {
      await streamProviderModel(model, payload, res);
      return;
    } catch (error) {
      lastError = error;

      if (!error.isModelError || res.headersSent) {
        throw error;
      }

      console.warn(`Model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('All configured models failed');
}

async function callModelWithFallback(payload, models) {
  let lastError = null;

  for (const model of models) {
    try {
      return await callProviderModel(model, payload);
    } catch (error) {
      lastError = error;

      if (!error.isModelError) {
        throw error;
      }

      console.warn(`Model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('All configured models failed');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
  if (!PROVIDER_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const {
    messages = [],
    userMessage = '',
    attachments = [],
    mode = 'default',
    purpose = 'chat',
    systemPrompt = '',
  } = req.body || {};

  if (!Array.isArray(messages) || !Array.isArray(attachments)) {
    return res.status(400).json({ error: 'Messages and attachments must be arrays' });
  }

  if (typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'User message must be a string' });
  }

  if (typeof systemPrompt !== 'string') {
    return res.status(400).json({ error: 'System prompt must be a string' });
  }

  if (!userMessage.trim() && attachments.length === 0) {
    return res.status(400).json({ error: 'Missing user message or attachments' });
  }

  try {
    const normalizedMode = normalizeMode(mode);
    const normalizedPurpose = normalizePurpose(purpose);
    const normalizedSystemPrompt = normalizeSystemPrompt(systemPrompt);
    const contents = buildContents(messages, userMessage, attachments);

    if (!contents.length) {
      return res.status(400).json({ error: 'No valid chat content was provided' });
    }

    const models = getModelsForMode(normalizedMode, userMessage, normalizedPurpose);
    const generationConfig = getGenerationConfig(normalizedMode, userMessage, normalizedPurpose, normalizedSystemPrompt);
    const payload = { contents, generationConfig };

    if (normalizedPurpose === 'chat' && normalizedSystemPrompt) {
      payload.systemInstruction = { parts: [{ text: normalizedSystemPrompt }] };
    }

    const result = await callModelWithFallback(payload, models);

    if (normalizedPurpose === 'chat') {
      const isSymptomLog = isSymptomLogRequest(userMessage, normalizedSystemPrompt);
      
      if (isSymptomLog) {
        // Return raw text (the JSON) for specialized flows
        return res.json({
          text: result.text,
          model: result.model
        });
      }

      return res.json({
        ...normalizeStructuredChatResponse(result.text),
        model: result.model,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Chat request failed' });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  if (!PROVIDER_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const {
    messages = [],
    userMessage = '',
    attachments = [],
    mode = 'default',
    purpose = 'chat',
    systemPrompt = '',
  } = req.body || {};

  if (purpose === 'title') {
    return res.status(400).json({ error: 'Title requests do not support streaming' });
  }

  if (!Array.isArray(messages) || !Array.isArray(attachments)) {
    return res.status(400).json({ error: 'Messages and attachments must be arrays' });
  }

  if (typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'User message must be a string' });
  }

  if (typeof systemPrompt !== 'string') {
    return res.status(400).json({ error: 'System prompt must be a string' });
  }

  if (!userMessage.trim() && attachments.length === 0) {
    return res.status(400).json({ error: 'Missing user message or attachments' });
  }

  try {
    const normalizedMode = normalizeMode(mode);
    const normalizedSystemPrompt = normalizeSystemPrompt(systemPrompt);
    const contents = buildContents(messages, userMessage, attachments);

    if (!contents.length) {
      return res.status(400).json({ error: 'No valid chat content was provided' });
    }

    const models = getModelsForMode(normalizedMode, userMessage, 'chat');
    const generationConfig = getGenerationConfig(normalizedMode, userMessage, 'chat', normalizedSystemPrompt);
    const payload = { contents, generationConfig };

    if (normalizedSystemPrompt) {
      payload.systemInstruction = { parts: [{ text: normalizedSystemPrompt }] };
    }

    await streamModelWithFallback(payload, models, res);
    res.end();
  } catch (error) {
    console.error('Proxy stream error:', error);

    if (res.headersSent) {
      sendStreamEvent(res, { type: 'error', error: error.message || 'Chat request failed' });
      return res.end();
    }

    return res.status(error.status || 500).json({ error: error.message || 'Chat request failed' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Dampi AI proxy running on http://${HOST}:${PORT}`);
});
