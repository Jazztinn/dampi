import React, { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { NAV_TABS, FAB_CONFIG } from "../utils/appConfig.js";
import "./bottom-nav.css";

export default function BottomNav({ active, setActive, openChatModal }) {
  const tabs = NAV_TABS;

  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [showHelpBubble, setShowHelpBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const idleTimer = useRef(null);

  useEffect(() => {
    if (dismissed) return;
    idleTimer.current = setTimeout(() => setShowHelpBubble(true), 5000);
    return () => clearTimeout(idleTimer.current);
  }, [dismissed]);

  const send = () => {
    if (!msg.trim()) return;
    const responses = FAB_CONFIG.quickReplies;
    setReply(responses[Math.floor(Math.random() * responses.length)]);
    setMsg("");
    setTimeout(() => setReply(""), 3500);
  };

  return (
    <div className="bottom-nav">
      <div className="nav-pill-wrap">
        <div className="nav-pill">
          {tabs.map(({ id, Icon }) => (
            <button
              key={id}
              className={`nav-btn ${active === id ? "active" : ""}`}
              onClick={() => setActive(id)}
            >
              <Icon size={21} />
            </button>
          ))}
        </div>
      </div>

      {FAB_CONFIG.show && (
        <div className="nav-fab-wrap">
          {showHelpBubble && (
            <div className="fab-help-bubble">
              <span className="fab-help-text">Need any help?</span>
              <button
                className="fab-help-dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissed(true);
                  setShowHelpBubble(false);
                  clearTimeout(idleTimer.current);
                }}
              >
                &times;
              </button>
            </div>
          )}
          {FAB_CONFIG.showQuickInput && (
            <div className="fab-chat">
              {reply && <div className="fab-chat-msg">💬 {reply}</div>}
              <div className="fab-chat-row">
                <input
                  className="fab-chat-input"
                  placeholder={FAB_CONFIG.quickInputPlaceholder}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button className="fab-chat-send" onClick={send}>
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          )}
          <button className="nav-fab" onClick={() => openChatModal?.("text")}>
            <MessageCircle size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
