import React from 'react';
import '../styles/chat-ui.css';

export default function ChatFab({ onClick, label = 'Open AI chat' }) {
  return (
    <button type="button" className="dampi-chat-fab" onClick={onClick} aria-label={label}>
      <span className="dampi-chat-fab__badge">AI</span>
    </button>
  );
}
