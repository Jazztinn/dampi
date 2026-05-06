import React, { useRef, useState } from 'react';
import { streamAiChat } from '../client/chatApi.js';
import { CHAT_SYSTEM_PROMPT } from '../config/prompts.js';
import '../styles/chat-ui.css';

let nextMessageId = 1;

function createMessage(role, text, extra = {}) {
  return {
    id: `message-${nextMessageId++}`,
    role,
    text,
    ...extra,
  };
}

export default function ChatModal({
  isOpen,
  onClose,
  title = 'Dampi AI',
  systemPrompt = CHAT_SYSTEM_PROMPT,
}) {
  const [messages, setMessages] = useState([
    createMessage(
      'assistant',
      'Hi. I can help with planning, drafting, and general support tasks for Dampi.'
    ),
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) {
    return null;
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1];
        setAttachments((current) => [
          ...current,
          {
            name: file.name,
            mime: file.type,
            data: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSend = async () => {
    if (loading) return;

    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const currentAttachments = attachments;
    const userMessage = createMessage(
      'user',
      text || `Attached: ${currentAttachments.map((attachment) => attachment.name).join(', ')}`,
      { attachments: currentAttachments }
    );
    const historyForApi = [...messages, userMessage];
    const assistantMessage = createMessage('assistant', '');

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      const response = await streamAiChat(historyForApi, text || 'Describe the attached file(s).', {
        mode: 'auto',
        attachments: currentAttachments,
        systemPrompt,
        onEvent: (event) => {
          if (event.type !== 'text' || !event.text) return;

          setMessages((current) => current.map((message) => (
            message.id === assistantMessage.id
              ? { ...message, text: `${message.text || ''}${event.text}` }
              : message
          )));
        },
      });
      const reply = typeof response === 'string' ? response : response?.text;

      setMessages((current) => current.map((message) => (
        message.id === assistantMessage.id
          ? { ...message, text: reply || message.text || 'Done.' }
          : message
      )));
    } catch (error) {
      setMessages((current) => current.map((message) => (
        message.id === assistantMessage.id
          ? { ...message, text: `Sorry, I hit an error: ${error.message}` }
          : message
      )));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dampi-chat-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dampi-chat-modal">
        <div className="dampi-chat-header">
          <div>
            <div className="dampi-chat-eyebrow">Assistant</div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="dampi-chat-close" onClick={onClose} aria-label="Close chat">
            x
          </button>
        </div>

        <div className="dampi-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`dampi-chat-message dampi-chat-message--${message.role}`}
            >
              <div className="dampi-chat-message__role">{message.role === 'assistant' ? 'AI' : 'You'}</div>
              <div className="dampi-chat-message__text">{message.text || 'Thinking...'}</div>
            </div>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="dampi-chat-attachments">
            {attachments.map((attachment, index) => (
              <div key={`${attachment.name}-${index}`} className="dampi-chat-attachment">
                <span>{attachment.name}</span>
                <button type="button" onClick={() => removeAttachment(index)} aria-label={`Remove ${attachment.name}`}>
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="dampi-chat-composer">
          <textarea
            className="dampi-chat-input"
            rows="3"
            placeholder="Ask Dampi AI anything helpful..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="dampi-chat-actions">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
            />
            <button type="button" className="dampi-chat-secondary" onClick={() => fileInputRef.current?.click()}>
              Attach
            </button>
            <button type="button" className="dampi-chat-primary" onClick={handleSend} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
