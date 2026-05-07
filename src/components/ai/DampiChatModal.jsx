import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Menu, ChevronDown, Plus, Loader2, Send, Stethoscope, CalendarPlus, ShieldCheck, Pill, ListChecks, XCircle, MessageSquare, Trash2, Pencil, Check, Square, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dampiIcon from "../../assets/dampi.svg";
import { callDampiChat, streamDampiChat, transcribeDampiAudio } from "../../services/ai/dampiApi.js";
import { createSymptomLog, completeSymptomLog } from "../../services/symptomLog/symptomLogPersistence.js";
import {
  appendAiChatMessage,
  createLocalChat,
  deleteAiChatConversation,
  ensureAiChatConversation,
  loadAiChatConversations,
  updateAiChatConversationTitle,
} from "../../services/ai/chatPersistence.js";
import { CHAT_SYSTEM_PROMPT, CHAT_STRUCTURED_RESPONSE_PROMPT, CHAT_CONTEXT_CONFIG } from "../../constants/dampiAi.js";
import { QUICK_LOG_EXTRACTION_PROMPT, QUICK_LOG_SUMMARY_PROMPT } from "../../constants/symptomLogAi.js";
import { extractJson } from "../../screens/SymptomLog/prompts.js";
import QuickSymptomLogPanel from "./QuickSymptomLogPanel.jsx";
import {
  buildQuickLogSummaryPayload,
  clearQuickLog,
  createQuickLogPdfAttachment,
  emptyQuickLog,
  getQuickLogMissingRequired,
  loadQuickLog,
  mergeExtraction,
  normalizeQuickLog,
  QUICK_LOG_STATUS,
  saveQuickLog,
  saveQuickLogToFullDraft,
} from "./quickSymptomLog.js";
import "../../styles/dampi-chat.css";

const SUGGESTIONS = [
  { icon: Stethoscope, label: "Check Symptoms", prompt: "Help me think through my child's symptoms. Ask about age, symptoms, duration, temperature, hydration, breathing, and warning signs before giving general guidance. Tell me when urgent care or a licensed clinician is needed." },
  { icon: CalendarPlus, label: "Plan Clinic Visit", prompt: "Help me plan a clinic visit for my child. Ask what the visit is for, preferred date, location or doctor, and what documents or notes I should bring. If I ask you to schedule a reminder, propose the task first." },
  { icon: ShieldCheck, label: "Log Symptoms", prompt: "Help me log my child's symptoms. Ask about the symptom type, severity, when it started, and any other relevant details like temperature or associated symptoms." },
  { icon: Pill, label: "Medicine Reminder", prompt: "Help me set up a medicine reminder. Ask for the medicine name, dose, timing, start date, and any instructions. Propose the task first and wait for my approval before adding it." },
  { icon: ListChecks, label: "HMO Documents", prompt: "Help me prepare HMO or clinic documents for my child. Ask which request I am working on, what documents I already have, what is missing, and whether I need help drafting a checklist for the visit." },
];

const CHAT_PLACEHOLDER = "Message Dampi…";

/* Snap points as % of parent height */
const SNAP_MIN = 0.38;   // collapsed
const SNAP_MID = 0.62;   // default
const SNAP_MAX = 0.92;   // expanded

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const MARKDOWN_PLUGINS = [remarkGfm];
const VALID_TASK_TAGS = new Set(["Health", "Clinic", "Medicine", "Documents", "Urgent", "Other"]);
const MAX_QUESTION_OPTIONS = 5;
const MAX_AUTO_TITLE_WORDS = 5;
const MAX_AUTO_TITLE_LENGTH = 48;

function getVoiceRecorderMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";

  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function appendVoiceTranscript(currentInput, transcript) {
  const current = currentInput.trimEnd();
  const spoken = transcript.trim();
  if (!spoken) return currentInput;
  return current ? `${current} ${spoken}` : spoken;
}

function isVoiceRecordingSupported() {
  return Boolean(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("Unable to read voice recording."));
    reader.readAsDataURL(blob);
  });
}

function parseDateKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return { key, date };
}

function formatDateForPrompt(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildTaskCalendarContext(tasksByDate = {}) {
  const entries = Object.entries(tasksByDate)
    .filter(([, tasks]) => Array.isArray(tasks) && tasks.length > 0)
    .map(([key, tasks]) => {
      const parsed = parseDateKey(key);
      if (!parsed) return null;
      return { key: parsed.key, date: parsed.date, tasks };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  const totalTasks = entries.reduce((sum, entry) => sum + entry.tasks.length, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const preferredEntries = entries.filter((entry) => entry.date >= today);
  const contextEntries = (preferredEntries.length > 0 ? preferredEntries : entries).slice(0, CHAT_CONTEXT_CONFIG.maxDates);

  const lines = [
    "Live calendar context for this user:",
    `- Today: ${formatDateForPrompt(today)} (${todayKey})`,
    `- Calendar dates with tasks: ${entries.length}`,
    `- Total saved tasks: ${totalTasks}`,
  ];

  if (contextEntries.length === 0) {
    lines.push("- Upcoming tasks: none saved.");
    return lines.join("\n");
  }

  lines.push("- Upcoming task details:");

  contextEntries.forEach((entry) => {
    lines.push(`  - ${formatDateForPrompt(entry.date)} (${entry.key})`);

    entry.tasks.slice(0, CHAT_CONTEXT_CONFIG.maxTasksPerDate).forEach((task, idx) => {
      const title = typeof task.title === "string" && task.title.trim() ? task.title.trim() : `Task ${idx + 1}`;
      const time = typeof task.time === "string" && task.time.trim() ? ` @ ${task.time.trim()}` : "";
      const tag = typeof task.tag === "string" && task.tag.trim() ? ` [${task.tag.trim()}]` : "";
      lines.push(`    - ${title}${time}${tag}`);
    });

    const remaining = entry.tasks.length - CHAT_CONTEXT_CONFIG.maxTasksPerDate;
    if (remaining > 0) {
      lines.push(`    - (+${remaining} more task${remaining === 1 ? "" : "s"})`);
    }
  });

  return lines.join("\n");
}

function normalizeTaskForCreation(rawTask) {
  if (!rawTask || typeof rawTask !== "object") return null;

  const title = typeof rawTask.title === "string" ? rawTask.title.trim() : "";
  const date = typeof rawTask.date === "string" ? rawTask.date.trim() : "";
  if (!title || !parseDateKey(date)) return null;

  const time = typeof rawTask.time === "string" ? rawTask.time.trim() : "";
  const desc = typeof rawTask.desc === "string" ? rawTask.desc.trim() : "";
  const tag = typeof rawTask.tag === "string" && VALID_TASK_TAGS.has(rawTask.tag.trim())
    ? rawTask.tag.trim()
    : "Other";

  return {
    id: Date.now() + Math.floor(Math.random() * 1_000_000),
    title,
    date,
    time,
    desc,
    tag,
  };
}

function normalizeQuestionForUi(rawQuestion, idx) {
  if (typeof rawQuestion === "string") {
    const question = rawQuestion.trim();
    if (!question) return null;
    return {
      id: `q-${idx + 1}`,
      question,
      options: [],
      allowFreeText: true,
      inputPlaceholder: "Type your answer...",
    };
  }

  if (!rawQuestion || typeof rawQuestion !== "object") return null;

  const question = typeof rawQuestion.question === "string" ? rawQuestion.question.trim() : "";
  if (!question) return null;

  const options = Array.isArray(rawQuestion.options)
    ? rawQuestion.options
        .map((option) => (typeof option === "string" ? option.trim() : ""))
        .filter(Boolean)
        .slice(0, MAX_QUESTION_OPTIONS)
    : [];

  const id = typeof rawQuestion.id === "string" && rawQuestion.id.trim()
    ? rawQuestion.id.trim()
    : `q-${idx + 1}`;

  const allowFreeText = typeof rawQuestion.allowFreeText === "boolean"
    ? rawQuestion.allowFreeText
    : true;

  const inputPlaceholder = typeof rawQuestion.inputPlaceholder === "string" && rawQuestion.inputPlaceholder.trim()
    ? rawQuestion.inputPlaceholder.trim()
    : "Type your answer...";

  return { id, question, options, allowFreeText, inputPlaceholder };
}

function normalizeTaskActions(rawActions = {}) {
  const createTasks = Array.isArray(rawActions?.createTasks)
    ? rawActions.createTasks.map(normalizeTaskForCreation).filter(Boolean)
    : [];
  const askQuestions = Array.isArray(rawActions?.askQuestions)
    ? rawActions.askQuestions.map(normalizeQuestionForUi).filter(Boolean)
    : [];

  return { createTasks, askQuestions };
}

function formatTaskDateForUi(dateKey) {
  const parsed = parseDateKey(dateKey);
  return parsed ? formatDateForPrompt(parsed.date) : dateKey;
}

function formatTaskCount(count) {
  return `${count} task${count === 1 ? "" : "s"}`;
}

function formatTaskSummaryForText(task) {
  const parts = [formatTaskDateForUi(task.date)];
  if (task.time) parts.push(task.time);
  if (task.tag) parts.push(task.tag);

  return `- ${task.title} (${parts.join(", ")})${task.desc ? `: ${task.desc}` : ""}`;
}

/** Ask Gemini to generate a short title for the conversation */
async function generateTitle(messages) {
  try {
    const snippet = messages.slice(0, 4).map((m) => `${m.role}: ${m.text?.slice(0, 120)}`).join("\n");
    const title = await callDampiChat(
      [],
      `Below is the start of a conversation. Generate a short title (max 5 words, no quotes, no punctuation at the end) that captures the topic.\n\n${snippet}`,
      { mode: "fast", purpose: "title" }
    );
    const cleaned = title.replace(/^["']|["']$/g, "").replace(/[.!?]+$/, "").trim();
    return cleaned || "New Chat";
  } catch {
    return "New Chat";
  }
}

function truncateTitle(text) {
  if (!text) return "New Chat";
  if (text.length <= MAX_AUTO_TITLE_LENGTH) return text;
  return `${text.slice(0, MAX_AUTO_TITLE_LENGTH - 1).trimEnd()}…`;
}

function generateFallbackTitle(userMessage, attachments = []) {
  const normalizedMessage = typeof userMessage === "string"
    ? userMessage
        .replace(/\s+/g, " ")
        .replace(/[*_`>#\[\]()]/g, " ")
        .trim()
    : "";

  if (normalizedMessage) {
    const words = normalizedMessage.split(" ").filter(Boolean).slice(0, MAX_AUTO_TITLE_WORDS);
    if (words.length > 0) {
      return truncateTitle(words.join(" "));
    }
  }

  if (attachments.length > 0) {
    const firstAttachmentName = attachments[0]?.name
      ?.replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

    if (firstAttachmentName) {
      return truncateTitle(firstAttachmentName);
    }

    return attachments.length === 1 ? "Attached file" : `${attachments.length} attachments`;
  }

  return "New Chat";
}

function shouldOfferQuickLog(text) {
  const normalized = String(text || "").toLowerCase();
  if (normalized.length < 10) return false;
  return /\b(fever|cough|rash|vomit|diarrhea|pain|headache|stomach|breath|wheeze|symptom|sick|temperature|lagnat|ubo|suka|rashes)\b/i.test(normalized);
}

function buildExtractionRequest(quickLog, latestMessage) {
  return [
    "Existing quick-log draft:",
    JSON.stringify({
      chiefComplaint: quickLog.chiefComplaint,
      duration: quickLog.duration,
      severity: quickLog.severity,
      temperature: quickLog.temperature,
      heartRate: quickLog.heartRate,
      oxygenSat: quickLog.oxygenSat,
      associatedSymptoms: quickLog.associatedSymptoms,
      medicationsGiven: quickLog.medicationsGiven,
      medicalHistory: quickLog.medicalHistory,
      parentNotes: quickLog.parentNotes,
    }),
    "",
    "Latest parent message:",
    latestMessage,
  ].join("\n");
}

function buildSummaryRequest(quickLog, children = [], profile = null) {
  const child = children.find((item) => item.id === quickLog.selectedChildId);
  return [
    "Quick symptom log draft:",
    JSON.stringify({
      child: child ? {
        name: child.full_name,
        dateOfBirth: child.date_of_birth,
        gender: child.gender,
        weight: child.weight,
        bloodType: child.blood_type,
      } : null,
      recordedBy: profile?.full_name || "",
      chiefComplaint: quickLog.chiefComplaint,
      duration: quickLog.duration,
      severity: quickLog.severity,
      temperature: quickLog.temperature,
      heartRate: quickLog.heartRate,
      oxygenSat: quickLog.oxygenSat,
      associatedSymptoms: quickLog.associatedSymptoms,
      medicationsGiven: quickLog.medicationsGiven,
      medicalHistory: quickLog.medicalHistory,
      parentNotes: quickLog.parentNotes,
    }),
  ].join("\n");
}

function normalizeSummaryResult(raw) {
  return {
    summaryText: typeof raw?.summaryText === "string" ? raw.summaryText.trim() : "",
    redFlags: Array.isArray(raw?.redFlags) ? raw.redFlags.map((item) => String(item || "").trim()).filter(Boolean) : [],
    recommendedNextSteps: Array.isArray(raw?.recommendedNextSteps) ? raw.recommendedNextSteps.map((item) => String(item || "").trim()).filter(Boolean) : [],
    missingInformation: Array.isArray(raw?.missingInformation) ? raw.missingInformation.map((item) => String(item || "").trim()).filter(Boolean) : [],
  };
}

function normalizeVisibleChatText(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/gi, ""));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && typeof parsed.message === "string") {
      return parsed.message.trim();
    }
  } catch {
    /* not a JSON envelope */
  }

  return text;
}

export default function ChatModal({
  isOpen,
  onClose,
  tasks = {},
  setTasks,
  profile = null,
  child = null,
  children = [],
  onOpenSymptomLogDraft,
  trialMode = false,
  onTrialExhausted,
}) {
  const nextChatIdRef = useRef(1);
  const nextMessageIdRef = useRef(1);

  const createChat = () => createLocalChat(nextChatIdRef.current++);
  const createMessageId = (prefix = "msg") => `${prefix}-${nextMessageIdRef.current++}`;

  const initialChatRef = useRef(null);
  if (!initialChatRef.current) {
    initialChatRef.current = createChat();
  }

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [chats, setChats] = useState(() => [initialChatRef.current]);
  const [activeChatId, setActiveChatId] = useState(() => initialChatRef.current.id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [questionDrafts, setQuestionDrafts] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const accountChildren = useMemo(() => {
    if (Array.isArray(children) && children.length > 0) return children;
    return child ? [child] : [];
  }, [child, children]);
  const [quickLog, setQuickLog] = useState(() => loadQuickLog(accountChildren));
  const [quickLogExtracting, setQuickLogExtracting] = useState(false);
  const [quickLogSummarizing, setQuickLogSummarizing] = useState(false);
  const [trialLocked, setTrialLocked] = useState(false);
  const trialCountRef = useRef(0);
  const [quickLogSaving, setQuickLogSaving] = useState(false);
  const fileInputRef = useRef(null);
  const activeStreamRef = useRef(null);
  const voiceRecorderSupported = useMemo(() => isVoiceRecordingSupported(), []);
  const voiceRecorderMimeType = useMemo(() => getVoiceRecorderMimeType(), []);
  const mediaRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const discardVoiceRecordingRef = useRef(false);
  const sendVoiceTranscriptRef = useRef(null);

  /* derived */
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const taskCalendarContext = useMemo(() => buildTaskCalendarContext(tasks), [tasks]);
  const chatSystemPrompt = useMemo(
    () => `${CHAT_SYSTEM_PROMPT}\n\n${CHAT_STRUCTURED_RESPONSE_PROMPT}\n\n${taskCalendarContext}`,
    [taskCalendarContext]
  );

  useEffect(() => {
    setQuickLog((current) => normalizeQuickLog(current, accountChildren));
  }, [accountChildren]);

  useEffect(() => {
    saveQuickLog(quickLog);
  }, [quickLog]);

  const setMessages = (updater, chatId = activeChatId) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: typeof updater === "function" ? updater(c.messages) : updater }
          : c
      )
    );
  };

  const setChatTitle = (id, title, { persist = true } = {}) => {
    const normalizedTitle = title?.trim() || "New Chat";
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: normalizedTitle } : c)));
    if (persist) {
      updateAiChatConversationTitle(id, normalizedTitle).catch((error) => {
        console.error(error);
        setHistoryError(error.message || "Unable to save chat title.");
      });
    }
  };

  const stopVoiceRecording = useCallback((discardTranscript = false) => {
    discardVoiceRecordingRef.current = discardTranscript;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = null;
    mediaRecorderRef.current = null;
    voiceChunksRef.current = [];
    setVoiceListening(false);
    if (discardTranscript) setVoiceTranscribing(false);
  }, []);

  const handleVoiceToggle = useCallback(async () => {
    if (!voiceRecorderSupported || loading || historyLoading || voiceTranscribing) return;

    if (voiceListening) {
      stopVoiceRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderOptions = voiceRecorderMimeType ? { mimeType: voiceRecorderMimeType } : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);

      voiceChunksRef.current = [];
      discardVoiceRecordingRef.current = false;
      voiceStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        discardVoiceRecordingRef.current = true;
        setVoiceError("Voice recording failed. Try again.");
        setVoiceListening(false);
        setVoiceTranscribing(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onstop = async () => {
        const chunks = [...voiceChunksRef.current];
        const shouldDiscard = discardVoiceRecordingRef.current;
        const mime = recorder.mimeType || voiceRecorderMimeType || "audio/webm";

        voiceChunksRef.current = [];
        mediaRecorderRef.current = null;
        voiceStreamRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        setVoiceListening(false);

        if (shouldDiscard) {
          discardVoiceRecordingRef.current = false;
          setVoiceTranscribing(false);
          return;
        }

        if (chunks.length === 0) {
          setVoiceError("No voice recording was captured.");
          return;
        }

        setVoiceTranscribing(true);
        setVoiceError("");

        try {
          const audioBlob = new Blob(chunks, { type: mime });
          const data = await blobToBase64(audioBlob);
          const transcript = await transcribeDampiAudio({
            name: `voice-dictation.${mime.includes("mp4") ? "m4a" : "webm"}`,
            mime,
            data,
          });

          if (transcript && !discardVoiceRecordingRef.current) {
            setInput("");
            sendVoiceTranscriptRef.current?.(transcript);
          } else if (!discardVoiceRecordingRef.current) {
            setVoiceError("No clear speech was detected.");
          }
        } catch (error) {
          if (!discardVoiceRecordingRef.current) {
            setVoiceError(error.message || "Voice transcription failed.");
          }
        } finally {
          discardVoiceRecordingRef.current = false;
          setVoiceTranscribing(false);
        }
      };

      recorder.start();
      setVoiceListening(true);
      setVoiceError("");
    } catch (error) {
      const permissionDenied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
      setVoiceError(permissionDenied ? "Microphone permission is blocked." : "Voice recording could not start.");
      setVoiceListening(false);
      setVoiceTranscribing(false);
    }
  }, [historyLoading, loading, stopVoiceRecording, voiceListening, voiceRecorderMimeType, voiceRecorderSupported, voiceTranscribing]);

  /* drag state */
  const [sheetHeight, setSheetHeight] = useState(SNAP_MID); // fraction 0-1
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(SNAP_MID);
  const dragPointerId = useRef(null);
  const containerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const updateQuickLog = useCallback((patch) => {
    setQuickLog((current) => ({
      ...current,
      ...patch,
      status: patch.status || current.status,
      error: patch.error !== undefined ? patch.error : "",
    }));
  }, []);

  const startQuickLog = useCallback((seed = {}) => {
    setQuickLog((current) => ({
      ...emptyQuickLog(accountChildren),
      ...current,
      ...seed,
      status: QUICK_LOG_STATUS.capture,
      expanded: true,
      error: "",
    }));
    if (sheetHeight < SNAP_MID) setSheetHeight(SNAP_MID);
  }, [accountChildren, sheetHeight]);

  const discardQuickLog = useCallback(() => {
    clearQuickLog();
    setQuickLog(emptyQuickLog(accountChildren));
  }, [accountChildren]);

  const ensurePersistedActiveChat = useCallback(async () => {
    const chatAtSave = chats.find((c) => c.id === activeChatId) || activeChat;
    const originalId = chatAtSave?.id || activeChatId;
    const persistedChat = await ensureAiChatConversation(chatAtSave);
    if (persistedChat.id !== originalId) {
      setChats((prev) => prev.map((chat) => (
        chat.id === originalId
          ? { ...chat, id: persistedChat.id, title: persistedChat.title }
          : chat
      )));
      setActiveChatId(persistedChat.id);
    }
    return persistedChat.id;
  }, [activeChat, activeChatId, chats]);

  const extractQuickLogFromMessage = useCallback(async (latestMessage, baseQuickLog = quickLog) => {
    if (baseQuickLog.status !== QUICK_LOG_STATUS.capture) return;
    setQuickLogExtracting(true);
    try {
      const response = await callDampiChat([], buildExtractionRequest(baseQuickLog, latestMessage), {
        mode: "fast",
        systemPrompt: QUICK_LOG_EXTRACTION_PROMPT,
      });
      const rawText = response?.text || "";
      const extracted = extractJson(rawText);
      setQuickLog((current) => mergeExtraction({ ...current, error: "" }, extracted));
    } catch (error) {
      console.error(error);
      setQuickLog((current) => ({
        ...current,
        error: "I could not update the symptom log from that message. You can edit the fields directly.",
      }));
    } finally {
      setQuickLogExtracting(false);
    }
  }, [quickLog]);

  const reviewQuickLog = useCallback(async () => {
    if (quickLogSummarizing) return;
    setQuickLogSummarizing(true);
    try {
      const response = await callDampiChat([], buildSummaryRequest(quickLog, accountChildren, profile), {
        mode: "fast",
        systemPrompt: QUICK_LOG_SUMMARY_PROMPT,
      });
      const parsed = normalizeSummaryResult(extractJson(response?.text || ""));
      setQuickLog((current) => ({
        ...current,
        ...parsed,
        status: QUICK_LOG_STATUS.review,
        expanded: true,
        error: "",
      }));
    } catch (error) {
      console.error(error);
      setQuickLog((current) => ({
        ...current,
        status: QUICK_LOG_STATUS.review,
        expanded: true,
        summaryText: current.summaryText || [
          current.chiefComplaint,
          current.duration ? `Duration: ${current.duration}` : "",
          current.severity ? `Severity: ${current.severity}` : "",
          current.parentNotes,
        ].filter(Boolean).join("\n"),
        error: "Dampi could not generate a structured summary. Review and edit the captured fields before saving.",
      }));
    } finally {
      setQuickLogSummarizing(false);
    }
  }, [accountChildren, profile, quickLog, quickLogSummarizing]);

  const saveQuickSymptomLog = useCallback(async () => {
    const missing = getQuickLogMissingRequired(quickLog);
    if (quickLogSaving || missing.length > 0) return;
    setQuickLogSaving(true);
    try {
      const conversationId = await ensurePersistedActiveChat();
      const created = quickLog.createdLogId
        ? { id: quickLog.createdLogId }
        : await createSymptomLog(quickLog.selectedChildId, conversationId);
      setQuickLog((current) => ({ ...current, createdLogId: created.id, conversationId }));
      const summary = buildQuickLogSummaryPayload({ ...quickLog, conversationId }, accountChildren, profile);
      const completed = await completeSymptomLog(created.id, {
        summary,
        summaryText: quickLog.summaryText,
        chiefComplaint: quickLog.chiefComplaint,
      });
      const pdfAttachment = createQuickLogPdfAttachment(summary, completed.id);
      const pdfMessage = {
        id: createMessageId("assistant-symptom-pdf"),
        role: "assistant",
        text: "I prepared a PDF copy of the symptom log.",
        attachments: [pdfAttachment],
      };
      const savedPdfMessage = await appendAiChatMessage(conversationId, pdfMessage);
      setMessages((prev) => [...prev, savedPdfMessage || pdfMessage], conversationId);
      window.dispatchEvent(new CustomEvent("dampi:symptom-log-saved", { detail: { id: completed.id } }));
      setQuickLog((current) => ({
        ...current,
        status: QUICK_LOG_STATUS.saved,
        expanded: true,
        conversationId,
        createdLogId: null,
        savedLogId: completed.id,
        savedAt: completed.completed_at || new Date().toISOString(),
        error: "",
      }));
    } catch (error) {
      console.error(error);
      setQuickLog((current) => ({
        ...current,
        createdLogId: current.createdLogId,
        error: error.message || "Unable to save symptom log. Try again.",
      }));
    } finally {
      setQuickLogSaving(false);
    }
  }, [accountChildren, ensurePersistedActiveChat, profile, quickLog, quickLogSaving]);

  const sendQuestionReply = (questionKey) => {
    const reply = (questionDrafts[questionKey] || "").trim();
    if (!reply || loading || historyLoading) return;

    setQuestionDrafts((prev) => ({ ...prev, [questionKey]: "" }));
    send(reply);
  };

  const approveProposedTasks = async (messageId, proposedTasks = [], chatId = activeChatId) => {
    if (loading || historyLoading || typeof setTasks !== "function" || proposedTasks.length === 0) return;

    setTasks((prev) => {
      const next = { ...prev };

      proposedTasks.forEach((task) => {
        next[task.date] = [
          ...(Array.isArray(next[task.date]) ? next[task.date] : []),
          {
            id: task.id,
            title: task.title,
            time: task.time,
            desc: task.desc,
            tag: task.tag,
          },
        ];
      });

      return next;
    });

    setMessages((prev) => prev.map((message) => (
      message.id === messageId
        ? { ...message, taskApprovalStatus: "approved" }
        : message
    )), chatId);

    const confirmationEntry = {
      id: createMessageId("assistant-task-confirmed"),
      role: "assistant",
      text: `Added ${formatTaskCount(proposedTasks.length)} to your calendar.`,
    };
    let savedConfirmationEntry = null;
    try {
      savedConfirmationEntry = await appendAiChatMessage(chatId, confirmationEntry);
    } catch (error) {
      console.error(error);
      setHistoryError(error.message || "Task added, but the confirmation could not be saved.");
    }
    setMessages((prev) => [...prev, savedConfirmationEntry || confirmationEntry], chatId);
  };

  const requestClose = useCallback(() => {
    if (isClosing) return;
    activeStreamRef.current?.abortController?.abort();
    stopVoiceRecording(true);
    clearTimeout(closeTimerRef.current);
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      onClose();
    }, 260);
  }, [isClosing, onClose, stopVoiceRecording]);

  const openFullSymptomLog = useCallback(() => {
    if (quickLog.status !== QUICK_LOG_STATUS.inactive) {
      saveQuickLogToFullDraft(quickLog);
    }
    onOpenSymptomLogDraft?.({
      childId: quickLog.selectedChildId || null,
      savedLogId: quickLog.savedLogId || null,
    });
    requestClose();
  }, [onOpenSymptomLogDraft, quickLog, requestClose]);

  /* reset height when modal opens */
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current);
      setIsRendered(true);
      setIsClosing(false);
      setSheetHeight(SNAP_MID);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const persistedChats = await loadAiChatConversations();
        if (!active) return;

        const nextChats = persistedChats.length > 0 ? persistedChats : [createChat()];
        setChats(nextChats);
        setActiveChatId(nextChats[0].id);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setHistoryError(error.message || "Unable to load saved chats.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => () => {
    clearTimeout(closeTimerRef.current);
    stopVoiceRecording(true);
  }, [stopVoiceRecording]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ---- drag handlers ---- */
  const onDragStart = useCallback((e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragPointerId.current = e.pointerId;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartH.current = sheetHeight;
  }, [sheetHeight]);

  const onDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    if (dragPointerId.current !== null && e.pointerId !== dragPointerId.current) return;
    e.preventDefault();
    const parentH = containerRef.current.parentElement?.clientHeight || window.innerHeight;
    const dy = dragStartY.current - e.clientY;
    const newH = clamp(dragStartH.current + dy / parentH, 0.25, 0.95);
    setSheetHeight(newH);
  }, [isDragging]);

  const snapTo = useCallback((h) => {
    const snaps = [SNAP_MIN, SNAP_MID, SNAP_MAX];
    // if dragged below minimum, close
    if (h < 0.22) { requestClose(); return; }
    // find nearest snap
    let best = snaps[0];
    for (const s of snaps) if (Math.abs(s - h) < Math.abs(best - h)) best = s;
    setSheetHeight(best);
  }, [requestClose]);

  const onDragEnd = useCallback((e) => {
    if (!isDragging) return;
    if (e?.pointerId && dragPointerId.current !== null && e.pointerId !== dragPointerId.current) return;
    e?.currentTarget?.releasePointerCapture?.(dragPointerId.current);
    dragPointerId.current = null;
    setIsDragging(false);
    snapTo(sheetHeight);
  }, [isDragging, sheetHeight, snapTo]);

  useEffect(() => {
    if (!chats.some((chat) => chat.id === activeChatId) && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  /* ---- file attachment ---- */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mime: file.type,
            data: base64,
            preview: file.type.startsWith("image/") ? reader.result : null,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const stopActiveGeneration = useCallback((reason = "stop") => {
    if (!activeStreamRef.current) return false;
    activeStreamRef.current.reason = reason;
    activeStreamRef.current.abortController.abort();
    return true;
  }, []);

  /* ---- chat logic ---- */
  const send = async (text, options = {}) => {
    if (loading || historyLoading || trialLocked) return;

    stopVoiceRecording(true);
    setVoiceError("");

    const userMessage = text || input.trim();
    if (!userMessage && attachments.length === 0) return;

    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    const requestText = userMessage || "Describe the attached file(s).";
    const originalChatIdAtSend = activeChatId;
    const chatAtSend = chats.find((c) => c.id === originalChatIdAtSend);
    const quickLogAtSend = options.quickLogAtSend || quickLog;
    const draftUserEntry = {
      id: createMessageId("user"),
      role: "user",
      text: userMessage || `📎 ${currentAttachments.map((a) => a.name).join(", ")}`,
      attachments: currentAttachments,
    };
    const pendingId = createMessageId("assistant-pending");
    const pendingEntry = {
      id: pendingId,
      role: "assistant",
      text: "",
      pending: true,
    };
    const shouldSeedTitle = (chatAtSend?.title || "New Chat") === "New Chat" && (chatAtSend?.messages?.length || 0) === 0;
    const seededTitle = shouldSeedTitle ? generateFallbackTitle(requestText, currentAttachments) : null;
    let durableChatId = originalChatIdAtSend;
    setLoading(true);
    if (sheetHeight < SNAP_MID) setSheetHeight(SNAP_MID);

    try {
      let chatIdAtSend;
      if (trialMode) {
        chatIdAtSend = originalChatIdAtSend;
      } else {
        const persistedChat = await ensureAiChatConversation(chatAtSend);
        chatIdAtSend = persistedChat.id;
        durableChatId = chatIdAtSend;
        if (chatIdAtSend !== originalChatIdAtSend) {
          setChats((prev) => prev.map((chat) => (
            chat.id === originalChatIdAtSend
              ? { ...chat, id: chatIdAtSend, title: persistedChat.title }
              : chat
          )));
          setActiveChatId(chatIdAtSend);
        }
        if (seededTitle) {
          setChatTitle(chatIdAtSend, seededTitle);
        }
      }

      const abortController = new AbortController();
      activeStreamRef.current = {
        abortController,
        chatId: chatIdAtSend,
        pendingId,
        reason: "stream",
      };

      const savedUserEntry = trialMode ? null : await appendAiChatMessage(chatIdAtSend, draftUserEntry);
      const visibleUserEntry = savedUserEntry || draftUserEntry;

      // Build history including the new user message for the API call
      // (React state `messages` is stale inside this closure)
      const historyForApi = [...(chatAtSend?.messages || []), visibleUserEntry];

      setMessages((prev) => [...prev, visibleUserEntry, pendingEntry], chatIdAtSend);

      const response = await streamDampiChat(historyForApi, requestText, {
        attachments: currentAttachments,
        systemPrompt: chatSystemPrompt,
        signal: abortController.signal,
        onEvent: (event) => {
          if (event.type !== "text" || !event.text) return;

          setMessages((prev) => prev.map((message) => (
            message.id === pendingId
              ? { ...message, text: `${message.text || ""}${event.text}` }
              : message
          )), chatIdAtSend);
        },
      });

      const responseText = typeof response === "string" ? response : response?.text;
      const structuredActions = typeof response === "object" && response
        ? normalizeTaskActions(response.taskActions)
        : null;
      const visibleText = normalizeVisibleChatText(responseText || "");
      const createTasks = structuredActions ? structuredActions.createTasks : [];
      const askQuestions = structuredActions ? structuredActions.askQuestions : [];
      const proposedTasks = typeof setTasks === "function" ? createTasks : [];
      const quickStartOffer = quickLogAtSend.status === QUICK_LOG_STATUS.inactive && shouldOfferQuickLog(requestText);
      const taskApprovalLine = proposedTasks.length > 0
        ? `\n\nProposed ${formatTaskCount(proposedTasks.length)}:\n${proposedTasks.map(formatTaskSummaryForText).join("\n")}\n\nApprove before I add ${proposedTasks.length === 1 ? "it" : "them"} to your calendar.`
        : "";
      const fallbackText = askQuestions.length > 0
        ? "I need a couple of quick details before I add that task."
        : "Done.";
      const assistantText = `${visibleText || ""}${taskApprovalLine}`.trim() || fallbackText;
      const assistantEntry = {
        id: pendingId,
        role: "assistant",
        text: assistantText,
        questions: askQuestions,
        proposedTasks,
        quickStartOffer,
        quickStartSeed: quickStartOffer ? requestText : "",
        taskApprovalStatus: proposedTasks.length > 0 ? "pending" : undefined,
      };
      const savedAssistantEntry = trialMode ? null : await appendAiChatMessage(chatIdAtSend, assistantEntry);
      const visibleAssistantEntry = {
        ...(savedAssistantEntry || assistantEntry),
        pending: false,
        proposedTasks,
        quickStartOffer,
        quickStartSeed: quickStartOffer ? requestText : "",
        taskApprovalStatus: proposedTasks.length > 0 ? "pending" : undefined,
      };

      setMessages((prev) => {
        const updated = prev.map((message) => (
          message.id === pendingId
            ? visibleAssistantEntry
            : message
        ));
        return updated;
      }, chatIdAtSend);

      if (!trialMode) {
        const messagesForTitle = [...historyForApi, { id: pendingId, role: "assistant", text: assistantText }];
        if ((chatAtSend?.title || "New Chat") === "New Chat" && messagesForTitle.filter((m) => m.role === "assistant").length === 1) {
          generateTitle(messagesForTitle).then((t) => setChatTitle(chatIdAtSend, t));
        }
      }

      if (trialMode) {
        const newCount = trialCountRef.current + 1;
        trialCountRef.current = newCount;
        if (newCount >= 2) {
          const lockMsgId = createMessageId("trial-lock");
          setTimeout(() => {
            setMessages((prev) => [...prev, {
              id: lockMsgId,
              role: "assistant",
              text: "Nakita mo na ang kakayahan ng Dampi! I-sign up para mapatuloy ang iyong karanasan at mapanatili ang lahat ng iyong mga tala.",
            }]);
            setTimeout(() => setTrialLocked(true), 700);
          }, 300);
        }
      }

      if (!options.skipQuickExtraction && quickLogAtSend.status === QUICK_LOG_STATUS.capture && userMessage) {
        extractQuickLogFromMessage(userMessage, quickLogAtSend);
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        const abortMeta = activeStreamRef.current;
        const wasDeleted = abortMeta?.reason === "delete";

        if (!wasDeleted) {
          setMessages((prev) => prev.flatMap((message) => {
            if (message.id !== pendingId) return [message];

            const partialText = typeof message.text === "string" ? message.text.trim() : "";
            if (!partialText) return [];

            return [{
              ...message,
              text: partialText,
              pending: false,
            }];
          }), durableChatId);
        }

        return;
      }

      console.error(err);
      let errorMsg = err.message || "Failed to connect";
      
      // Better error messages
      if (errorMsg.includes("Failed to fetch")) {
        errorMsg = "Backend not running. Start proxy: cd ai/server && npm run dev";
      } else if (errorMsg.includes("API request failed")) {
        errorMsg = "API Error: Check console. Backend proxy may not have valid API key.";
      }
      
      setMessages((prev) => {
        if (!prev.some((message) => message.id === pendingId)) {
          return [
            ...prev,
            draftUserEntry,
            {
              id: pendingId,
              role: "assistant",
              text: `Error: ${errorMsg}`,
              pending: false,
            },
          ];
        }

        return prev.map((message) => (
          message.id === pendingId
            ? { ...message, role: "assistant", text: `Error: ${errorMsg}`, pending: false }
            : message
        ));
      }, durableChatId);
    } finally {
      if (activeStreamRef.current?.pendingId === pendingId) {
        activeStreamRef.current = null;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    sendVoiceTranscriptRef.current = (transcript) => {
      send(transcript);
    };
  });

  const handleNewChat = () => {
    stopVoiceRecording(true);
    const fresh = createChat();
    setChats((prev) => [fresh, ...prev]);
    setActiveChatId(fresh.id);
    setInput("");
    setAttachments([]);
    setVoiceError("");
    setQuestionDrafts({});
    setShowHistory(false);
  };

  const switchChat = (id) => {
    stopVoiceRecording(true);
    setActiveChatId(id);
    setInput("");
    setAttachments([]);
    setVoiceError("");
    setQuestionDrafts({});
    setShowHistory(false);
  };

  const deleteChat = (id) => {
    if (activeStreamRef.current?.chatId === id) {
      stopActiveGeneration("delete");
    }

    deleteAiChatConversation(id).catch((error) => {
      console.error(error);
      setHistoryError(error.message || "Unable to delete saved chat.");
    });

    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createChat();
        return [fresh];
      }
      return remaining;
    });
  };

  const handleSuggestion = (label) => {
    if (loading || historyLoading) return;
    const suggestion = SUGGESTIONS.find((item) => item.label === label);
    if (label === "Log Symptoms") {
      startQuickLog();
      send(suggestion?.prompt || label, {
        quickLogAtSend: { ...quickLog, status: QUICK_LOG_STATUS.capture },
        skipQuickExtraction: true,
      });
      return;
    }
    send(suggestion?.prompt || label);
  };

  const visibleSuggestions = showAllSuggestions ? SUGGESTIONS : SUGGESTIONS.slice(0, 2);

  if (!isRendered) return null;

  return (
    <div className={`chat-sheet-overlay ${isClosing ? "closing" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <div
        ref={containerRef}
        className={`chat-sheet ${isDragging ? "dragging" : ""} ${isClosing ? "closing" : ""}`}
        style={{ height: `${sheetHeight * 100}%` }}
      >
        <div className="chat-sheet-body">
        {/* Trial curtain — rendered when user hits the 2-message limit */}
        {trialLocked && (
          <div className="chat-trial-curtain">
            <div className="chat-trial-cta">
              <img src={dampiIcon} alt="Dampi" className="chat-trial-cta__logo" />
              <p className="chat-trial-cta__headline">Sign up to continue using Dampi</p>
              <p className="chat-trial-cta__sub">Keep all your chats, symptom logs, and health history.</p>
              <button
                className="onboarding-cta chat-trial-cta__btn"
                onClick={() => onTrialExhausted?.()}
              >
                Create Free Account
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="chat-modal-header">
          {trialMode ? (
            <div className="chat-header-btn" aria-hidden="true" />
          ) : (
            <button className="chat-header-btn" onClick={() => setShowHistory((v) => !v)} aria-label={showHistory ? "Close chat history" : "Open chat history"}>
              <Menu size={20} />
            </button>
          )}
          <div
            className="chat-header-title"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab' }}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          >
            <div className="chat-header-title-stack">
              <div className="chat-sheet-notch">
                <div className="chat-sheet-pill" />
              </div>
              <div className="chat-header-active-title">
                {activeChat?.title || "New Chat"}
              </div>
            </div>
          </div>
          <button className="chat-header-btn" onClick={requestClose} aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        {/* History panel (full-width, replaces chat content) */}
        {showHistory ? (
          <div className="chat-history-panel">
            <div className="chat-history-top">
              <div>
                <span className="chat-history-title">Your Chats</span>
              </div>
              <button className="chat-history-new-btn" onClick={handleNewChat} title="New chat">
                <Plus size={16} />
              </button>
            </div>
            <div className="chat-history-list">
              {historyLoading && (
                <div className="chat-history-empty">Loading saved chats...</div>
              )}
              {historyError && (
                <div className="chat-history-empty">{historyError}</div>
              )}
              {chats.map((c) => (
                <div
                  key={c.id}
                  className={`chat-history-item ${c.id === activeChatId ? "active" : ""}`}
                  onClick={() => { if (editingChatId !== c.id) switchChat(c.id); }}
                >
                  <MessageSquare size={15} className="chat-history-item-icon" />
                  <div className="chat-history-item-info">
                    {editingChatId === c.id ? (
                      <input
                        className="chat-history-item-edit"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setChatTitle(c.id, editingTitle.trim() || "New Chat");
                            setEditingChatId(null);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="chat-history-item-title">{c.title}</span>
                        <span className="chat-history-item-preview">
                          {c.messages.length === 0 ? "No messages yet" : `${c.messages.length} message${c.messages.length === 1 ? "" : "s"}`}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="chat-history-item-actions">
                    {editingChatId === c.id ? (
                      <span
                        className="chat-history-item-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatTitle(c.id, editingTitle.trim() || "New Chat");
                          setEditingChatId(null);
                        }}
                      >
                        <Check size={14} />
                      </span>
                    ) : (
                      <span
                        className="chat-history-item-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(c.id);
                          setEditingTitle(c.title);
                        }}
                      >
                        <Pencil size={13} />
                      </span>
                    )}
                    {chats.length > 1 && editingChatId !== c.id && (
                      <span
                        className="chat-history-item-action chat-history-item-delete"
                        onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                      >
                        <Trash2 size={14} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <>
        {/* Messages */}
        <div className="chat-modal-messages" ref={messagesContainerRef}>
          {messages.map((msg, idx) => (
            <div key={msg.id || `legacy-${idx}`} className={`chat-message chat-message-${msg.role}`}>
              {msg.role === "assistant" && (
                <img src={dampiIcon} alt="Dampi" className="chat-avatar" />
              )}
              <div className={`chat-bubble chat-bubble-${msg.role}`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="chat-bubble-attachments">
                    {msg.attachments.map((a, i) => (
                      a.preview
                        ? <img key={i} src={a.preview} alt={a.name} className="chat-attach-thumb" />
                        : a.download && a.data && a.mime
                          ? (
                            <a
                              key={i}
                              className="chat-attach-file chat-attach-file--download"
                              href={`data:${a.mime};base64,${a.data}`}
                              download={a.name || "attachment.pdf"}
                            >
                              Download {a.name || "attachment"}
                            </a>
                          )
                          : <span key={i} className="chat-attach-file">📎 {a.name}</span>
                    ))}
                  </div>
                )}
                {msg.pending && !msg.text ? <Loader2 size={18} className="spin" /> : (
                  <>
                    <div className="chat-markdown">
                      <ReactMarkdown
                        remarkPlugins={MARKDOWN_PLUGINS}
                        components={{
                          a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" />,
                        }}
                      >
                        {msg.text || ""}
                      </ReactMarkdown>
                    </div>
                    {msg.pending && <Loader2 size={14} className="spin" />}
                    {Array.isArray(msg.questions) && msg.questions.length > 0 && (
                      <div className="chat-ai-questions">
                        {msg.questions.map((question, qIdx) => {
                          const questionId = question.id || `question-${qIdx}`;
                          const questionReplyKey = `${msg.id || `legacy-${idx}`}-${questionId}`;

                          return (
                            <div className="chat-ai-question" key={questionId}>
                              <div className="chat-ai-question-text">{question.question}</div>
                              {Array.isArray(question.options) && question.options.length > 0 && (
                                <div className="chat-ai-options">
                                  {question.options.map((option, optIdx) => (
                                    <button
                                      key={`${questionId}-option-${optIdx}`}
                                      type="button"
                                      className="chat-ai-option-btn"
                                      disabled={loading || historyLoading}
                                      onClick={() => {
                                        if (!loading && !historyLoading) send(option);
                                      }}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {question.allowFreeText !== false && (
                                <div className="chat-ai-freeform">
                                  <input
                                    type="text"
                                    className="chat-ai-input"
                                    placeholder={question.inputPlaceholder || "Type your answer..."}
                                    value={questionDrafts[questionReplyKey] || ""}
                                    disabled={loading || historyLoading}
                                    onChange={(e) => {
                                      const nextValue = e.target.value;
                                      setQuestionDrafts((prev) => ({ ...prev, [questionReplyKey]: nextValue }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        sendQuestionReply(questionReplyKey);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="chat-ai-send-btn"
                                    disabled={loading || historyLoading || !(questionDrafts[questionReplyKey] || "").trim()}
                                    onClick={() => sendQuestionReply(questionReplyKey)}
                                  >
                                    <Send size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {Array.isArray(msg.proposedTasks) && msg.proposedTasks.length > 0 && (
                      <div className="chat-task-approval">
                        <div className="chat-task-approval-title">Proposed calendar tasks</div>
                        <div className="chat-task-approval-list">
                          {msg.proposedTasks.map((task) => (
                            <div className="chat-task-approval-item" key={task.id}>
                              <div className="chat-task-approval-item-title">{task.title}</div>
                              <div className="chat-task-approval-item-meta">
                                <span>{formatTaskDateForUi(task.date)}</span>
                                {task.time && <span>{task.time}</span>}
                                {task.tag && <span>{task.tag}</span>}
                              </div>
                              {task.desc && <div className="chat-task-approval-item-desc">{task.desc}</div>}
                            </div>
                          ))}
                        </div>
                        {/* TODO: Persist proposedTasks on ai_chat_messages so approvals can survive refresh/history reload. */}
                        {msg.taskApprovalStatus === "approved" ? (
                          <div className="chat-task-approval-status">Added to your calendar.</div>
                        ) : (
                          <button
                            type="button"
                            className="chat-task-approval-btn"
                            disabled={loading || historyLoading || typeof setTasks !== "function"}
                            onClick={() => approveProposedTasks(msg.id, msg.proposedTasks, activeChatId)}
                          >
                            Add {formatTaskCount(msg.proposedTasks.length)}
                          </button>
                        )}
                      </div>
                    )}
                    {msg.quickStartOffer && quickLog.status === QUICK_LOG_STATUS.inactive && (
                      <div className="chat-quick-log-offer">
                        <div>
                          <strong>Turn this into a symptom log?</strong>
                          <span>I can keep a structured draft while we continue chatting.</span>
                        </div>
                        <button
                          type="button"
                          className="chat-task-approval-btn"
                          onClick={() => startQuickLog({ chiefComplaint: msg.quickStartSeed || "" })}
                        >
                          Start quick log
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && !messages.some((msg) => msg.pending) && (
            <div className="chat-message chat-message-assistant">
              <img src={dampiIcon} alt="Dampi" className="chat-avatar" />
              <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">
                <Loader2 size={18} className="spin" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions accordion */}
        <div className="chat-suggestions">
          <div className="chat-suggestion-chips" style={{ background: 'transparent' }}>
            {visibleSuggestions.map(({ icon: Icon, label }, i) => (
              <button key={i} className="chat-suggestion-chip" onClick={() => handleSuggestion(label)} disabled={loading || historyLoading}>
                <Icon size={13} className="chat-suggestion-chip-icon" />
                <span>{label}</span>
              </button>
            ))}
            {SUGGESTIONS.length > 2 && (
              <button
                className="chat-suggestion-chip chat-suggestion-chip-more"
                onClick={() => setShowAllSuggestions((v) => !v)}
              >
                <ChevronDown
                  size={13}
                  style={{ transform: showAllSuggestions ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                />
                <span>{showAllSuggestions ? "Less" : `+${SUGGESTIONS.length - 2}`}</span>
              </button>
            )}
          </div>
        </div>

        <QuickSymptomLogPanel
          quickLog={quickLog}
          children={accountChildren}
          extracting={quickLogExtracting}
          summarizing={quickLogSummarizing}
          saving={quickLogSaving}
          onUpdate={updateQuickLog}
          onStart={() => startQuickLog()}
          onDiscard={discardQuickLog}
          onToggleExpanded={() => updateQuickLog({ expanded: !quickLog.expanded })}
          onReview={reviewQuickLog}
          onEdit={() => updateQuickLog({ status: QUICK_LOG_STATUS.capture, expanded: true })}
          onSave={saveQuickSymptomLog}
          onOpenFull={openFullSymptomLog}
          onNewLog={() => setQuickLog({ ...emptyQuickLog(accountChildren), status: QUICK_LOG_STATUS.capture, expanded: true })}
        />

        {/* Input */}
        <div className="chat-modal-input-area">
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="chat-attach-preview-row">
              {attachments.map((a, i) => (
                <div key={i} className="chat-attach-preview">
                  {a.preview
                    ? <img src={a.preview} alt={a.name} className="chat-attach-preview-img" />
                    : <span className="chat-attach-preview-name">📎 {a.name}</span>
                  }
                  <button className="chat-attach-remove" onClick={() => removeAttachment(i)}>
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder={trialLocked ? "Sign up to continue…" : CHAT_PLACEHOLDER}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && !historyLoading && !trialLocked && send()}
              disabled={loading || historyLoading || trialLocked}
            />
            <button
              type="button"
              className={`chat-voice-btn${voiceListening ? " chat-voice-btn--listening" : ""}`}
              onClick={handleVoiceToggle}
              disabled={!voiceRecorderSupported || loading || historyLoading || voiceTranscribing || trialLocked}
              aria-label={
                !voiceRecorderSupported
                  ? "Voice dictation unavailable"
                  : voiceListening
                    ? "Stop voice dictation"
                    : voiceTranscribing
                      ? "Transcribing voice dictation"
                      : "Start voice dictation"
              }
              title={
                !voiceRecorderSupported
                  ? "Voice dictation unavailable in this browser"
                  : voiceListening
                    ? "Stop voice dictation"
                    : voiceTranscribing
                      ? "Transcribing voice dictation"
                      : "Start voice dictation"
              }
            >
              {voiceRecorderSupported ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              className="chat-send-btn"
              onClick={() => {
                if (loading) {
                  stopActiveGeneration("stop");
                  return;
                }
                send();
              }}
              disabled={historyLoading || trialLocked || (!loading && !input.trim() && attachments.length === 0)}
            >
              {loading ? <Square size={18} /> : <Send size={18} />}
            </button>
          </div>
          {(voiceListening || voiceTranscribing || voiceError) && (
            <div className={`chat-voice-status${voiceError ? " chat-voice-status--error" : ""}`} role={voiceError ? "alert" : "status"}>
              {voiceError || (voiceTranscribing ? "Transcribing..." : "Recording...")}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.md,.csv,.json"
            multiple
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <button className="chat-attach-action" onClick={() => fileInputRef.current?.click()} type="button">
            <Plus size={14} />
          </button>
        </div>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
