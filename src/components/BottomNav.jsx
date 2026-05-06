import React from "react";
import { NAV_TABS } from "../utils/appConfig.js";
import "./bottom-nav.css";

export default function BottomNav({ active, setActive }) {
  const tabs = NAV_TABS;

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
    </div>
  );
}
