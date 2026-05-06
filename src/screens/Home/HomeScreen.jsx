import {
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
      <div className="home__header-bg" aria-hidden="true" />

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
      </section>

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
              <h4 className="home__tip-title">{title}</h4>
              <p className="home__tip-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
}
