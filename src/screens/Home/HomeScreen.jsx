import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplets,
  HeartPulse,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Wind,
} from 'lucide-react';
  Stethoscope,
  Activity,
  Shield,
  Pill,
  Clock,
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './home-screen.css';

const PROGRESS_PCT = 85;
const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;
const RING_OFFSET = RING_C * (1 - PROGRESS_PCT / 100);

const today = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
});

const QUICK_ACTIONS = [
  {
    id: 'symptom',
    Icon: ClipboardList,
    label: 'Log Symptoms',
    sub: 'Fever, cough, rash, pain',
    tone: 'sage',
  },
  {
    id: 'hmo',
    Icon: ShieldCheck,
    label: 'Check Coverage',
    sub: 'Benefits and limits',
    tone: 'blue',
  },
  {
    id: 'clinic',
    Icon: MapPin,
    label: 'Find Care',
    sub: 'Nearby clinic options',
    tone: 'warm',
  },
  {
    id: 'ask',
    Icon: MessageCircle,
    label: 'Ask Dampi',
    sub: 'Prepare better questions',
    tone: 'green',
  },
];

const HEALTH_STATS = [
  { label: 'Temp', value: '37.2', unit: 'C', helper: 'Normal range', tone: 'sage' },
  { label: 'Fluids', value: '5', unit: 'cups', helper: 'Target: 6 cups', tone: 'blue' },
  { label: 'Sleep', value: '8.5', unit: 'hrs', helper: 'Resting well', tone: 'green' },
  { label: 'Risk', value: 'Low', unit: '', helper: 'No red flags', tone: 'warm' },
];

const RECENT_LOGS = [
  {
    id: 1,
    when: 'Today, 8:20 AM',
    title: 'Mild cough and runny nose',
    meta: 'No fever logged · monitor fluids',
    status: 'Stable',
  },
  {
    id: 2,
    when: 'Yesterday, 6:40 PM',
    title: 'Temperature check',
    meta: '37.8 C · reduced after rest',
    status: 'Reviewed',
  },
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DP';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

function getFirstName(name = '') {
  return name.trim().split(/\s+/)[0] || 'there';
}

function possessive(name) {
  if (!name) return "Your child's";
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

export default function HomeScreen({ profile, child, onNavigateToSymptoms, onOpenAi }) {
  const parentName = profile?.full_name || '';
  const childName = child?.full_name || 'your child';

  const handleQuickAction = (id) => {
    if (id === 'symptom') {
      onNavigateToSymptoms?.();
      return;
    }

    if (id === 'ask') {
      onOpenAi?.();
    }
  };

  return (
    <div className="home">
      <div className="home__statusbar" />

      <header className="home__topbar">
        <button className="home__icon-button" aria-label="Search care resources">
          <Search size={18} />
        </button>
        <div className="home__avatar" aria-label="User profile">
          <span>{getInitials(parentName)}</span>
const CATEGORIES = [
  { id: 'symptoms', Icon: Stethoscope, label: 'Symptom Log', stat: '3 this week', variant: 'sage' },
  { id: 'growth', Icon: Activity, label: 'Growth Track', stat: '32.5 kg', variant: 'teal' },
  { id: 'vaccines', Icon: Shield, label: 'Vaccines', stat: '2 upcoming', variant: 'warm' },
  { id: 'medications', Icon: Pill, label: 'Medications', stat: '1 active', variant: 'coral' },
];

const RECENT_LOGS = [
  { id: 1, child: 'Sofia', date: 'Yesterday, 2:30 PM', symptoms: ['Fever', 'Cough'], severity: 'moderate' },
  { id: 2, child: 'Miguel', date: 'Sunday, 10:15 AM', symptoms: ['Runny Nose', 'Rashes'], severity: 'mild' },
];

const HEALTH_TIPS = [
  { id: 1, Icon: Droplets, title: 'Stay Hydrated', body: 'Offer warm fluids to help your child stay healthy and comfortable.' },
  { id: 2, Icon: Thermometer, title: 'Check Temperature', body: 'Use a thermometer for accurate readings. Normal range: 36.5–37.5 °C.' },
  { id: 3, Icon: Wind, title: 'Fresh Air', body: 'Keep rooms ventilated and dress warmly, but avoid overheating.' },
];

export default function HomeScreen({ onNavigateToSymptoms }) {
  return (
    <div className="home">
      {/* Gradient sits behind TopNavBar — both are in normal flow */}
      <div className="home__header-bg" aria-hidden="true">
        <div className="home__header-blob" />
      </div>

      <TopNavBar variant="home" />

      {/* Progress card overlapping the header */}
      <section className="home__progress-card">
        <div className="home__progress-row">
          <div className="home__ring-wrap">
            <svg viewBox="0 0 120 120" width="110" height="110">
              <circle
                cx="60" cy="60" r={RING_R}
                fill="none" strokeWidth="10"
                className="home__ring-track"
              />
              <circle
                cx="60" cy="60" r={RING_R}
                fill="none" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_OFFSET}
                transform="rotate(-90 60 60)"
                className="home__ring-fill"
              />
            </svg>
            <span className="home__ring-label">{PROGRESS_PCT}%</span>
          </div>
          <div className="home__progress-info">
            <p className="home__progress-eyebrow">Your Progress</p>
            <p className="home__progress-detail">3 of 4 profiles complete</p>
            <p className="home__progress-date">{today}</p>
          </div>
        </div>

      <section className="home__greeting-card">
        <div>
          <p className="home__eyebrow">Today</p>
          <h1 className="home__greeting">Hi, {getFirstName(parentName)}</h1>
          <p className="home__date">{today}</p>
        </div>
        <div className="home__date-pill" aria-label="Current day">
          <Calendar size={15} />
          <span>{new Date().getDate()}</span>
        </div>
      </section>

      <section className="home__plan-card">
        <div className="home__plan-progress" aria-label="Daily care plan 72 percent complete">
          <span>72%</span>
        </div>
        <div className="home__plan-copy">
          <p className="home__eyebrow">Care Plan</p>
          <h2>{possessive(childName)} check-in is almost complete.</h2>
          <p>Log symptoms, confirm fluids, and note anything unusual before the next clinic visit.</p>
        <div className="home__stats-row">
          <div className="home__stat">
            <span className="home__stat-value">2</span>
            <span className="home__stat-label">Children</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">12</span>
            <span className="home__stat-label">Total Logs</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">May 8</span>
            <span className="home__stat-label">Next Visit</span>
          </div>
        </div>
        <button className="home__primary-cta" onClick={onNavigateToSymptoms}>
          Start Log
          <ChevronRight size={17} />
        </button>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>Quick actions</h2>
          <span>2 min</span>
        </div>
        <div className="home__actions-grid">
          {QUICK_ACTIONS.map(({ id, Icon, label, sub, tone }) => (
            <button
              key={id}
              className={`home__action-card home__action-card--${tone}`}
              onClick={() => handleQuickAction(id)}
            >
              <span className="home__action-icon-wrap">
                <Icon size={20} />
              </span>
              <span className="home__action-label">{label}</span>
              <span className="home__action-sub">{sub}</span>
      {/* Category grid */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Health Overview</h3>
        </div>
        <div className="home__categories">
          {CATEGORIES.map(({ id, Icon, label, stat, variant }) => (
            <button
              key={id}
              className={`home__cat-card home__cat-card--${variant}`}
              onClick={id === 'symptoms' ? onNavigateToSymptoms : undefined}
            >
              <div className="home__cat-icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <span className="home__cat-label">{label}</span>
              <span className="home__cat-stat">{stat}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>Child health board</h2>
          <span>Updated</span>
        </div>
        <div className="home__stats-grid">
          {HEALTH_STATS.map(({ label, value, unit, helper, tone }) => (
            <article key={label} className={`home__stat-card home__stat-card--${tone}`}>
              <p>{label}</p>
              <strong>
                {value}
                {unit && <small>{unit}</small>}
              </strong>
              <span>{helper}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h2>Recent logs</h2>
          <span>Stable</span>
        </div>
        <div className="home__logs-stack">
          {RECENT_LOGS.map(({ id, when, title, meta, status }) => (
            <article key={id} className="home__log-card">
              <div>
                <p className="home__log-when">{when}</p>
                <h3>{title}</h3>
                <p>{meta}</p>
      {/* Recent logs */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Recent Logs</h3>
          <button className="home__see-all">View all</button>
        </div>
        <div className="home__logs">
          {RECENT_LOGS.map(({ id, child, date, symptoms, severity }) => (
            <div key={id} className={`home__log-card home__log-card--${severity}`}>
              <div className="home__log-top">
                <div className="home__log-who">
                  <div className="home__log-avatar">{child[0]}</div>
                  <div>
                    <p className="home__log-name">{child}</p>
                    <p className="home__log-date"><Clock size={12} /> {date}</p>
                  </div>
                </div>
                <span className={`home__badge home__badge--${severity}`}>{severity}</span>
              </div>
              <div className="home__log-tags">
                {symptoms.map((s, i) => (
                  <span key={i} className="home__tag">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Health tips */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Health Tips</h3>
        </div>
        <div className="home__tips-scroll">
          {HEALTH_TIPS.map(({ id, Icon, title, body }) => (
            <div key={id} className="home__tip-card">
              <div className="home__tip-icon">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <span>{status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home__section">
        <div className="home__tips-card">
          <div className="home__tip-icons" aria-hidden="true">
            <Thermometer size={17} />
            <Droplets size={17} />
            <Wind size={17} />
            <HeartPulse size={17} />
          </div>
          <div>
            <p className="home__eyebrow">Parent note</p>
            <h2>Watch for breathing effort, dehydration, or persistent fever.</h2>
            <p>Kung hirap huminga, antukin, or hindi umiinom, seek urgent care right away.</p>
      {/* Emergency banner */}
      <section className="home__section">
        <div className="home__emergency">
          <AlertTriangle size={20} />
          <div>
            <h4 className="home__emergency-title">Need Urgent Help?</h4>
            <p className="home__emergency-sub">Call 911 or go to the nearest emergency room.</p>
          </div>
        </div>
      </section>

      <section className="home__emergency-banner">
        <AlertTriangle size={20} />
        <div>
          <h2>Emergency signs need direct care.</h2>
          <p>Call 911 or go to the nearest emergency room for severe symptoms.</p>
        </div>
        <Stethoscope size={24} aria-hidden="true" />
      </section>

      <div className="home__bottom-space" aria-hidden="true" />
      <div style={{ height: '100px' }} />
    </div>
  );
}
