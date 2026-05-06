import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { NAV_TABS, FAB_CONFIG } from "../utils/appConfig.js";
import "./bottom-nav.css";

export default function BottomNav({ active, setActive, openChatModal }) {
  const tabs = NAV_TABS;

  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");

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
