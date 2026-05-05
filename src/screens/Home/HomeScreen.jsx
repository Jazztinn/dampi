import {
  ClipboardList,
  Calendar,
  MapPin,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Droplets,
  Wind,
  Clock,
  AlertTriangle,
  Thermometer,
} from 'lucide-react';
import { useState } from 'react';
import './home-screen.css';

const today = new Date().toLocaleDateString('en-PH', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const QUICK_ACTIONS = [
  {
    id: 'symptom',
    Icon: ClipboardList,
    label: 'Symptom Log',
    sub: 'Record symptoms now',
    bg: 'var(--dampi-sage)',
    color: '#fff',
  },
  {
    id: 'queue',
    Icon: Calendar,
    label: 'View Queue',
    sub: 'Check wait time',
    bg: 'var(--dampi-teal)',
    color: '#fff',
  },
  {
    id: 'clinic',
    Icon: MapPin,
    label: 'Find Clinic',
    sub: 'Nearest centers',
    bg: 'var(--dampi-warm)',
    color: '#fff',
  },
  {
    id: 'emergency',
    Icon: AlertCircle,
    label: 'Emergency',
    sub: 'Urgent assistance',
    bg: 'var(--dampi-emergency)',
    color: '#fff',
  },
];

const HEALTH_TIPS = [
  {
    id: 1,
    Icon: Droplets,
    title: 'Panatilihing Rehidratado',
    body: 'Bigyan ng mainit na handog (mainit na tubig, mansanilya) ang bata para manatiling lagpas sa kalusugan.',
    lang: 'tl',
  },
  {
    id: 2,
    Icon: Thermometer,
    title: 'Sukat ang Temperatura',
    body: 'Gumamit ng thermometer para sa tumpak na pagsusukat. Normal: 36.5–37.5°C',
    lang: 'tl',
  },
  {
    id: 3,
    Icon: Wind,
    title: 'Magsanayong Pagsasarado',
    body: 'Panatilihing malayo sa malamig na hangin. Suot na damit para sa init.',
    lang: 'tl',
  },
];

const RECENT_LOGS = [
  {
    id: 1,
    date: 'Kahapon, 2:30 PM',
    symptoms: ['Lagnat', 'Ubo'],
    status: 'completed',
  },
  {
    id: 2,
    date: 'Linggo, 10:15 AM',
    symptoms: ['Sipon', 'Tigdas'],
    status: 'completed',
  },
];

export default function HomeScreen({ onNavigateToSymptoms }) {
  const [expandedLog, setExpandedLog] = useState(null);

  return (
    <div className="home">
      {/* ── Status bar spacer ── */}
      <div className="home__statusbar" />

      {/* ── Header ── */}
      <header className="home__header">
        <div className="home__greeting-block">
          <p className="home__greeting">Magandang Umaga!</p>
          <p className="home__date">{today}</p>
        </div>
        <div className="home__avatar" aria-label="User profile">
          <span className="home__avatar-initials">JD</span>
        </div>
      </header>

      {/* ── Primary CTA: Log Symptoms ── */}
      <section className="home__primary-action">
        <div className="home__primary-blob" aria-hidden="true" />
        <div className="home__primary-content">
          <p className="home__primary-label">Symptom Tracker</p>
          <h2 className="home__primary-title">Paano ang iyong bata ngayon?</h2>
          <p className="home__primary-sub">I-record ang mga symptom bago pumunta sa doktor.</p>
          <button className="home__primary-cta" onClick={onNavigateToSymptoms}>
            <ClipboardList size={18} strokeWidth={2} />
            Simulan ang Log
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Quick Actions</h3>
        </div>
        <div className="home__actions-grid">
          {QUICK_ACTIONS.map(({ id, Icon, label, sub, bg, color }) => (
            <button
              key={id}
              className="home__action-card"
              style={{ '--card-bg': bg, '--card-color': color }}
            >
              <span className="home__action-icon-wrap">
                <Icon size={22} strokeWidth={2} color={color} />
              </span>
              <span className="home__action-label">{label}</span>
              <span className="home__action-sub">{sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Symptom Logs ── */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Nakaraang Mga Log</h3>
        </div>

        {RECENT_LOGS.length > 0 ? (
          <div className="home__logs-stack">
            {RECENT_LOGS.map(({ id, date, symptoms, status }) => (
              <div
                key={id}
                className="home__log-card"
                onClick={() => setExpandedLog(expandedLog === id ? null : id)}
              >
                <div className="home__log-header">
                  <div className="home__log-meta">
                    <Clock size={14} className="home__log-icon" />
                    <span className="home__log-date">{date}</span>
                  </div>
                  <div className={`home__log-status home__log-status--${status}`}>
                    {status === 'completed' ? '✓' : '○'}
                  </div>
                </div>
                <div className="home__log-symptoms">
                  {symptoms.map((s, i) => (
                    <span key={i} className="home__symptom-tag">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="home__empty-state">
            <p>Walang nakaraang log pa. Simulan ang unang log ngayon.</p>
          </div>
        )}
      </section>

      {/* ── Health Tips ── */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Mga Tip para sa Kalusugan</h3>
        </div>

        <div className="home__tips-grid">
          {HEALTH_TIPS.map(({ id, Icon, title, body }) => (
            <div key={id} className="home__tip-card">
              <div className="home__tip-icon">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <h4 className="home__tip-title">{title}</h4>
              <p className="home__tip-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Emergency Info ── */}
      <section className="home__section">
        <div className="home__emergency-banner">
          <AlertTriangle size={20} />
          <div className="home__emergency-content">
            <h4 className="home__emergency-title">Kailangan ng Agarang Tulong?</h4>
            <p className="home__emergency-sub">Tumawag sa 911 o pumunta sa pinakamalapit na emergency room.</p>
          </div>
        </div>
      </section>

      {/* ── Bottom padding for floating nav ── */}
      <div style={{ height: '120px' }} />
    </div>
  );
}
