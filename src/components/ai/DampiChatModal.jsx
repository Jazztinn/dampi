import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Menu, ChevronDown, Plus, Loader2, Send, FileText, Search, LayoutGrid, XCircle, MessageSquare, Trash2, Pencil, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dampiIcon from "../../assets/dampi.svg";
import { callDampiChat, streamDampiChat } from "../../services/ai/dampiApi.js";
import {
  appendAiChatMessage,
  createLocalChat,
  deleteAiChatConversation,
  ensureAiChatConversation,
  loadAiChatConversations,
  updateAiChatConversationTitle,
} from "../../services/ai/chatPersistence.js";
import { CHAT_SYSTEM_PROMPT, CHAT_STRUCTURED_RESPONSE_PROMPT, CHAT_CONTEXT_CONFIG } from "../../constants/dampiAi.js";
import "../../styles/dampi-chat.css";

const SUGGESTIONS = [
  { icon: FileText, label: "Draft a Reply", prompt: "Help me draft a professional reply to a customer inquiry. Ask what the issue is and what tone I should use." },
  { icon: Search, label: "Find a Solution", prompt: "Help me find a solution to a customer's problem. Ask what the issue is and what I've already tried." },
  { icon: LayoutGrid, label: "Summarize Ticket", prompt: "Summarize this support ticket into key issues, actions taken, and next steps." },
  { icon: FileText, label: "Write FAQ Entry", prompt: "Help me write a clear FAQ entry. Ask what question customers are asking and what the answer should cover." },
  { icon: Search, label: "Escalation Template", prompt: "Help me write an escalation note for a ticket that needs to be handed off to a specialist." },
];

const CHAT_PLACEHOLDER = "Message Dampi…";

/* Snap points as % of parent height */
const SNAP_MIN = 0.38;   // collapsed
const SNAP_MID = 0.62;   // default
const SNAP_MAX = 0.92;   // expanded

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const MARKDOWN_PLUGINS = [remarkGfm];
const VALID_TASK_TAGS = new Set(["Billing", "Technical", "General", "Urgent", "Other"]);
const MAX_QUESTION_OPTIONS = 5;

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

export default function ChatModal({ isOpen, onClose, tasks = {}, setTasks }) {
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
  const fileInputRef = useRef(null);

  /* derived */
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const taskCalendarContext = useMemo(() => buildTaskCalendarContext(tasks), [tasks]);
  const chatSystemPrompt = useMemo(
    () => `${CHAT_SYSTEM_PROMPT}\n\n${CHAT_STRUCTURED_RESPONSE_PROMPT}\n\n${taskCalendarContext}`,
    [taskCalendarContext]
  );

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

  const sendQuestionReply = (questionKey) => {
    const reply = (questionDrafts[questionKey] || "").trim();
    if (!reply || loading || historyLoading) return;

    setQuestionDrafts((prev) => ({ ...prev, [questionKey]: "" }));
    send(reply);
  };

  /* drag state */
  const [sheetHeight, setSheetHeight] = useState(SNAP_MID); // fraction 0-1
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(SNAP_MID);
  const containerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    clearTimeout(closeTimerRef.current);
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      onClose();
    }, 260);
  }, [isClosing, onClose]);

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

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ---- drag handlers ---- */
  const getY = (e) => (e.touches ? e.touches[0].clientY : e.clientY);

  const onDragStart = useCallback((e) => {
    setIsDragging(true);
    dragStartY.current = getY(e);
    dragStartH.current = sheetHeight;
  }, [sheetHeight]);

  const onDragMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const parentH = containerRef.current.parentElement.clientHeight;
    const dy = dragStartY.current - getY(e);
    const newH = clamp(dragStartH.current + dy / parentH, 0.25, 0.95);
    setSheetHeight(newH);
  }, [isDragging]);

  const snapTo = useCallback((h) => {
    const snaps = [SNAP_MIN, SNAP_MID, SNAP_MAX];
    // if dragged below minimum, close
    if (h < 0.28) { requestClose(); return; }
    // find nearest snap
    let best = snaps[0];
    for (const s of snaps) if (Math.abs(s - h) < Math.abs(best - h)) best = s;
    setSheetHeight(best);
  }, [requestClose]);

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapTo(sheetHeight);
  }, [isDragging, sheetHeight, snapTo]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => onDragMove(e);
    const onUp = () => onDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, onDragMove, onDragEnd]);

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

  /* ---- chat logic ---- */
  const send = async (text) => {
    if (loading || historyLoading) return;

    const userMessage = text || input.trim();
    if (!userMessage && attachments.length === 0) return;

    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    const requestText = userMessage || "Describe the attached file(s).";
    const originalChatIdAtSend = activeChatId;
    const chatAtSend = chats.find((c) => c.id === originalChatIdAtSend);
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
    let durableChatId = originalChatIdAtSend;
    setLoading(true);
    if (sheetHeight < SNAP_MID) setSheetHeight(SNAP_MID);

    try {
      const persistedChat = await ensureAiChatConversation(chatAtSend);
      const chatIdAtSend = persistedChat.id;
      durableChatId = chatIdAtSend;
      if (chatIdAtSend !== originalChatIdAtSend) {
        setChats((prev) => prev.map((chat) => (
          chat.id === originalChatIdAtSend
            ? { ...chat, id: chatIdAtSend, title: persistedChat.title }
            : chat
        )));
        setActiveChatId(chatIdAtSend);
      }

      const savedUserEntry = await appendAiChatMessage(chatIdAtSend, draftUserEntry);
      const visibleUserEntry = savedUserEntry || draftUserEntry;

      // Build history including the new user message for the API call
      // (React state `messages` is stale inside this closure)
      const historyForApi = [...(chatAtSend?.messages || []), visibleUserEntry];

      setMessages((prev) => [...prev, visibleUserEntry, pendingEntry], chatIdAtSend);

      const response = await streamDampiChat(historyForApi, requestText, {
        attachments: currentAttachments,
        systemPrompt: chatSystemPrompt,
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
      const visibleText = responseText || "";
      const createTasks = structuredActions ? structuredActions.createTasks : [];
      const askQuestions = structuredActions ? structuredActions.askQuestions : [];
      const tasksToCreate = typeof setTasks === "function" ? createTasks : [];

      if (tasksToCreate.length > 0) {
        setTasks((prev) => {
          const next = { ...prev };

          tasksToCreate.forEach((task) => {
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
      }

      const taskCreatedLine = tasksToCreate.length > 0
        ? `\n\n✅ Added ${tasksToCreate.length} task${tasksToCreate.length === 1 ? "" : "s"} to your calendar.`
        : "";
      const fallbackText = askQuestions.length > 0
        ? "I need a couple of quick details before I add that task."
        : "Done.";
      const assistantText = `${visibleText || ""}${taskCreatedLine}`.trim() || fallbackText;
      const assistantEntry = {
        id: pendingId,
        role: "assistant",
        text: assistantText,
        questions: askQuestions,
      };
      const savedAssistantEntry = await appendAiChatMessage(chatIdAtSend, assistantEntry);

      setMessages((prev) => {
        const updated = prev.map((message) => (
          message.id === pendingId
            ? { ...(savedAssistantEntry || assistantEntry), pending: false }
            : message
        ));
        return updated;
      }, chatIdAtSend);

      const messagesForTitle = [...historyForApi, { id: pendingId, role: "assistant", text: assistantText }];
      if ((chatAtSend?.title || "New Chat") === "New Chat" && messagesForTitle.filter((m) => m.role === "assistant").length === 1) {
        generateTitle(messagesForTitle).then((t) => setChatTitle(chatIdAtSend, t));
      }
    } catch (err) {
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
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const fresh = createChat();
    setChats((prev) => [fresh, ...prev]);
    setActiveChatId(fresh.id);
    setInput("");
    setAttachments([]);
    setQuestionDrafts({});
    setShowHistory(false);
  };

  const switchChat = (id) => {
    setActiveChatId(id);
    setInput("");
    setAttachments([]);
    setQuestionDrafts({});
    setShowHistory(false);
  };

  const deleteChat = (id) => {
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
        {/* Header */}
        <div className="chat-modal-header">
          <button className="chat-header-btn" onClick={() => setShowHistory((v) => !v)} aria-label={showHistory ? "Close chat history" : "Open chat history"}>
            <Menu size={20} />
          </button>
          <div
            className="chat-header-title"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab' }}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            <div className="chat-sheet-notch">
              <div className="chat-sheet-pill" />
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
              placeholder={CHAT_PLACEHOLDER}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && !historyLoading && send()}
              disabled={loading || historyLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={loading || historyLoading || (!input.trim() && attachments.length === 0)}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
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
