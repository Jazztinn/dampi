import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceNoteButton({ onTranscript }) {
  const Ctor = getRecognitionCtor();
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => {
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  if (!Ctor) {
    return (
      <button
        type="button"
        className="symptom-log__icon-btn"
        title="Voice notes not supported in this browser"
        aria-label="Voice notes (unavailable)"
        disabled
      >
        <MicOff size={16} />
      </button>
    );
  }

  const start = () => {
    if (recording) {
      try { recRef.current?.stop(); } catch { /* noop */ }
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) onTranscript?.(transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  return (
    <button
      type="button"
      className={`symptom-log__icon-btn${recording ? ' symptom-log__icon-btn--recording' : ''}`}
      title={recording ? 'Stop recording' : 'Dictate a voice note'}
      aria-label={recording ? 'Stop voice note' : 'Start voice note'}
      onClick={start}
    >
      <Mic size={16} />
    </button>
  );
}
