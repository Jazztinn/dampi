import { useState, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';
import dampiLogo from '../../assets/dampi.svg';
import { streamDampiChat } from '../../services/ai/dampiApi.js';
import './onboarding.css';

const TRIAL_SYSTEM_PROMPT = `You are Dampi, a warm and caring Filipino child health assistant. Help parents with questions about their child's health, symptoms, medicines, and wellbeing. Be empathetic, concise (2-3 sentences max per reply), and practical. Respond in the same language the user writes in — Filipino/Tagalog or English.`;

const MAX_MESSAGES = 1;

let _msgId = 0;
const uid = () => `m${++_msgId}`;

export default function TryDampiScreen({ onNext }) {
  const [messages, setMessages] = useState([
    {
      id: uid(),
      role: 'assistant',
      text: 'Kumusta ka? I am Dampi, your friendly child health assistant. Subukan mo akong tanungin tungkol sa kalusugan ng iyong anak.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || locked) return;
    setInput('');

    const userMsg = { id: uid(), role: 'user', text };
    const pendingId = uid();
    const pendingMsg = { id: pendingId, role: 'assistant', text: '', pending: true };

    setMessages(prev => [...prev, userMsg, pendingMsg]);
    setLoading(true);

    const newCount = sentCount + 1;
    setSentCount(newCount);

    // Build history from previous (non-pending) messages
    const history = messages
      .filter(m => !m.pending)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      await streamDampiChat(history, text, {
        systemPrompt: TRIAL_SYSTEM_PROMPT,
        onEvent: (event) => {
          if (event.type === 'text') {
            setMessages(prev =>
              prev.map(m =>
                m.id === pendingId ? { ...m, text: m.text + event.text } : m
              )
            );
          }
        },
      });

      setMessages(prev =>
        prev.map(m => (m.id === pendingId ? { ...m, pending: false } : m))
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === pendingId
            ? { ...m, text: 'Sorry, may error. Subukan ulit.', pending: false }
            : m
        )
      );
    } finally {
      setLoading(false);
      if (newCount >= MAX_MESSAGES) {
        const lockId = uid();
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: lockId,
              role: 'assistant',
              text: 'Nakita mo na ang kakayahan ng Dampi! Mag-sign up para mapatuloy ang iyong karanasan at mapanatili ang lahat ng iyong mga tala.',
            },
          ]);
          setTimeout(() => setLocked(true), 800);
        }, 350);
      }
    }
  };

  const remaining = Math.max(0, MAX_MESSAGES - sentCount);

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2 className="brand-font">Try dampi</h2>
        <p>Chat with Dampi before you sign up</p>
      </div>

      {/* ── Framed chat box ── */}
      <div className="try-chat">
        {/* Header */}
        <div className="try-chat__header">
          <span className="try-chat__name"></span>
        </div>

        {/* Body wrapper to contain messages and overlay */}
        <div className="try-chat__body">
          {/* Messages */}
          <div className="try-chat__messages" ref={listRef}>
            {messages.map(msg => (
              <div key={msg.id} className={`try-chat__msg try-chat__msg--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <img src={dampiLogo} alt="" className="try-chat__avatar" />
                )}
                <div className="try-chat__bubble">
                  {msg.pending ? <span className="try-chat__dots">···</span> : msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Curtain overlay — fades in after 2nd response */}
          {locked && <div className="try-chat__curtain" />}
        </div>

        {/* Input */}
        <div className="try-chat__input-row">
          <input
            type="text"
            className="try-chat__input"
            placeholder={locked ? 'Chat locked' : 'Ask Dampi…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading || locked}
          />
          <button
            className="try-chat__send"
            onClick={send}
            disabled={!input.trim() || loading || locked}
            aria-label={locked ? 'Locked' : 'Send'}
          >
            {locked ? <Lock size={15} /> : <Send size={15} />}
          </button>
        </div>
      </div>

      {locked && (
        <div className="try-chat__cta">
          <img src={dampiLogo} alt="Dampi" className="try-chat__cta-logo" />
          <p className="try-chat__cta-headline">Sign up to continue using Dampi</p>
          <p className="try-chat__cta-sub">
            Keep all your chats, symptom logs, and health history.
          </p>
          <button className="onboarding-cta try-chat__cta-btn" onClick={() => onNext()}>
            Create Free Account
          </button>
        </div>
      )}

      {sentCount === 0 && (
        <button className="onboarding-secondary" onClick={() => onNext()}>
          Skip for now
        </button>
      )}
    </div>
  );
}
