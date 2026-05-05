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
        </div>
      </header>

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
    </div>
  );
}
