import React, { useState, useEffect, useRef } from "react";
import rumpelIcon from "../assets/rumpel.png";
import scaleDownVine from "../assets/scaledown.png";
import scaleUpVine from "../assets/scaleup.png";
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
          <img src={scaleDownVine} alt="" className="vine-overlay vine-down" />
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
        <img src={scaleUpVine} alt="" className="vine-overlay vine-up" />
      </div>

      {FAB_CONFIG.show && <div className="nav-fab-wrap">
        {showHelpBubble && (
          <div className="fab-help-bubble">
            <span className="fab-help-text">Need any help?</span>
            <button className="fab-help-dismiss" onClick={(e) => { e.stopPropagation(); setDismissed(true); setShowHelpBubble(false); clearTimeout(idleTimer.current); }}>&times;</button>
          </div>
        )}
        {FAB_CONFIG.showQuickInput && (
          <div className="fab-chat">
            {reply && <div className="fab-chat-msg">🧙 {reply}</div>}
            <div className="fab-chat-row">
              <input
                className="fab-chat-input"
                placeholder={FAB_CONFIG.quickInputPlaceholder}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="fab-chat-send" onClick={send}>
                <img src={rumpelIcon} alt="Send" style={{width: "16px", height: "16px", filter: "drop-shadow(0.5px 1px 1px rgba(205, 75, 35, 0.75))"}} />
              </button>
            </div>
          </div>
        )}
        <button className="nav-fab" onClick={() => openChatModal?.("text")}>
          <img src={rumpelIcon} alt="Dampi" style={{width: "32px", height: "32px", filter: "drop-shadow(1px 2px 2px rgba(183, 81, 47, 0.75))"}} />
        </button>
      </div>}
    </div>
  );
}
