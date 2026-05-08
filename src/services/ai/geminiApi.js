import { CHAT_SYSTEM_PROMPT } from '../../constants/dampiAi.js';

const GEMINI_API_KEY = import.meta.env.VITE_AI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const AVAILABLE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

const FAST_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const FULL_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro'];

const STRUCTURED_CHAT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    message: { type: 'STRING' },
    taskActions: {
      type: 'OBJECT',
      properties: {
        createTasks: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              isCompleted: { type: 'BOOLEAN' },
              description: { type: 'STRING' },
            },
          },
        },
        askQuestions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
        },
      },
    },
  },
};

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

function extractCandidateText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('') || '';
}

function normalizeStructuredChatResponse(rawText) {
  try {
    const parsed = JSON.parse(rawText);
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

function isComplexPrompt(text) {
  if (!text) return false;
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 80) return true;
  return /\b(explain|analyze|compare|summarize|essay|detail|research|step.by.step|write me)\b/i.test(text);
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

function isSymptomLogRequest(userMessage, systemPrompt) {
  const combined = `${userMessage}\n${systemPrompt}`;
  return combined.includes('Given a parent\'s description of their child\'s symptoms, return ONLY a single JSON object') ||
         combined.includes('Create the final review payload for a quick chat symptom log') ||
         combined.includes('Extract only symptom-log facts from the latest parent message') ||
         combined.includes('Use the parent\'s initial description, the child\'s profile, the parent\'s exam answers');
}

function getGenerationConfig(mode, prompt, purpose, systemPrompt = '') {
  if (purpose === 'title') {
    return {
      maxOutputTokens: 20,
      temperature: 0.3,
    };
  }
  if (purpose === 'transcription') {
    return {
      maxOutputTokens: 500,
      temperature: 0,
    };
  }

  const useFastProfile = mode === 'fast' || (mode === 'auto' && !isComplexPrompt(prompt));
  const isSymptomLog = isSymptomLogRequest(prompt, systemPrompt);

  const generationConfig = {
    maxOutputTokens: (useFastProfile && !isSymptomLog) ? 600 : 2048,
    temperature: useFastProfile ? 0.5 : 0.8,
  };

  if (purpose === 'chat') {
    if (!isSymptomLog) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = STRUCTURED_CHAT_SCHEMA;
    } else {
      generationConfig.responseMimeType = 'application/json';
    }
  }

  return generationConfig;
}

async function callGeminiApi(model, payload) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_AI_API_KEY is not set. Please configure it in your environment.');
  }

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
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
      throw new Error(message);
    }

    const text = extractCandidateText(data);
    if (!text) {
      throw new Error('No text in response');
    }

    return { text, model };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function streamGeminiApi(model, payload, onEvent) {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_AI_API_KEY is not set. Please configure it in your environment.');
  }

  const url = `${GEMINI_API_URL}/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
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
      throw new Error(data.error?.message || 'API error');
    }

    if (!response.body) {
      throw new Error('Streaming not supported');
    }

    const isSymptomLog = isSymptomLogRequest(
      payload.contents[payload.contents.length - 1]?.parts?.[0]?.text || '',
      payload.systemInstruction?.parts?.[0]?.text || ''
    );

    let rawText = '';
    let streamedMessage = '';
    const decoder = new TextDecoder();
    let buffer = '';

    const handleData = (eventData) => {
      if (eventData === '[DONE]') return;

      try {
        const data = JSON.parse(eventData);
        const newText = extractCandidateText(data);
        rawText += newText;

        if (isSymptomLog) {
          onEvent?.({ type: 'text', text: newText });
        } else {
          // Extract JSON message prefix
          const jsonMatch = /"message"\s*:\s*"/.exec(rawText);
          if (jsonMatch) {
            const nextMessage = rawText.slice(jsonMatch.index + jsonMatch[0].length)
              .split('"')[0]; // Get text until next quote
            if (nextMessage.length > streamedMessage.length) {
              const delta = nextMessage.slice(streamedMessage.length);
              streamedMessage = nextMessage;
              onEvent?.({ type: 'text', text: delta });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors during streaming
      }
    };

    const parseSseChunk = (chunk) => {
      const events = chunk.split(/\r?\n\r?\n/);
      const remainder = events.pop() || '';

      events.forEach((event) => {
        const dataLines = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart());

        dataLines.forEach((line) => {
          if (line) handleData(line);
        });
      });

      return remainder;
    };

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      buffer = parseSseChunk(buffer);
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      parseSseChunk(`${buffer}\n\n`);
    }

    if (isSymptomLog) {
      return {
        type: 'done',
        data: {
          text: rawText,
          model,
        },
      };
    } else {
      return {
        type: 'done',
        data: {
          ...normalizeStructuredChatResponse(rawText),
          model,
        },
      };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callModelWithFallback(messages, userMessage, systemPrompt, mode, purpose, attachments) {
  const models = getModelsForMode(mode, userMessage, purpose);
  const generationConfig = getGenerationConfig(mode, userMessage, purpose, systemPrompt);

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: buildContents(messages, userMessage, attachments),
    generationConfig,
    safetySettings: [
      { category: 'HARM_CATEGORY_UNSPECIFIED', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DEROGATORY_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_VIOLENCE', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUAL_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_MEDICAL', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  let lastError = null;
  for (const model of models) {
    try {
      return await callGeminiApi(model, payload);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('All configured models failed');
}

async function streamModelWithFallback(messages, userMessage, systemPrompt, mode, onEvent, signal) {
  const models = getModelsForMode(mode, userMessage, 'chat');
  const generationConfig = getGenerationConfig(mode, userMessage, 'chat', systemPrompt);

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: buildContents(messages, userMessage, []),
    generationConfig,
    safetySettings: [
      { category: 'HARM_CATEGORY_UNSPECIFIED', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DEROGATORY_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_VIOLENCE', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUAL_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_MEDICAL', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  let lastError = null;
  for (const model of models) {
    try {
      return await streamGeminiApi(model, payload, onEvent);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('All configured models failed');
}

export async function callGeminiChat(messages, userMessage, config = {}) {
  const purpose = config.purpose === 'title' ? 'title' : 'chat';

  const result = await callModelWithFallback(
    normalizeMessages(messages),
    typeof userMessage === 'string' ? userMessage : '',
    purpose === 'chat' ? normalizeSystemPrompt(config.systemPrompt) : '',
    normalizeMode(config.mode),
    purpose,
    normalizeAttachments(config.attachments)
  );

  return purpose === 'title' ? result.text : normalizeStructuredChatResponse(result.text);
}

export async function transcribeGeminiAudio(attachment) {
  const result = await callModelWithFallback(
    [],
    'Transcribe this audio exactly. Return only the spoken words. If there is no clear speech, return an empty string.',
    '',
    'fast',
    'transcription',
    normalizeAttachments([attachment])
  );

  return typeof result.text === 'string' ? result.text.trim() : '';
}

export async function streamGeminiChat(messages, userMessage, config = {}) {
  const finalData = await streamModelWithFallback(
    normalizeMessages(messages),
    typeof userMessage === 'string' ? userMessage : '',
    normalizeSystemPrompt(config.systemPrompt),
    normalizeMode(config.mode),
    config.onEvent,
    config.signal
  );

  return finalData.data;
}
