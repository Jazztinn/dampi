import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
  FileText,
} from 'lucide-react';
import TopNavBar, { getFirstName, getInitials } from '../../navigation/TopNavBar.jsx';
import DashboardMetricsCarousel from '../../components/DashboardMetricsCarousel.jsx';
import { loadSymptomLogs } from '../../services/symptomLog/symptomLogPersistence.js';
import './home-screen.css';

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

const today = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
});

const HEALTH_TIPS = [
  { id: 1, Icon: Droplets, title: 'Stay Hydrated', body: 'Offer warm fluids to help your child stay healthy and comfortable.' },
  { id: 2, Icon: Thermometer, title: 'Check Temperature', body: 'Use a thermometer for accurate readings. Normal range: 36.5-37.5 C.' },
  { id: 3, Icon: Wind, title: 'Fresh Air', body: 'Keep rooms ventilated and dress warmly, but avoid overheating.' },
];

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export default function HomeScreen({ profile, child, children = [], onNavigateToSymptoms }) {
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const refreshLogs = () => loadSymptomLogs(null, 5).then(setRecentLogs).catch(() => {});
    refreshLogs();
    window.addEventListener('dampi:symptom-log-saved', refreshLogs);
    return () => window.removeEventListener('dampi:symptom-log-saved', refreshLogs);
  }, []);

  const childCount = children.length || (child ? 1 : 0);
  const completedProfileItems = [
    Boolean(profile?.full_name),
    Boolean(profile?.phone),
    childCount > 0,
  ].filter(Boolean).length;
  const totalProfileItems = 3;
  const progressPct = Math.round((completedProfileItems / totalProfileItems) * 100);
  const ringOffset = RING_C * (1 - progressPct / 100);
  const firstName = getFirstName(profile?.full_name);
  const greeting = firstName ? `Hi, ${firstName}!` : 'Hi there!';
  const firstChildName = child?.full_name || children[0]?.full_name || 'your child';
  const progressDetail = `${completedProfileItems} of ${totalProfileItems} profile items complete`;
  const childSummary = childCount > 0
    ? `Tracking ${childCount} ${pluralize(childCount, 'child', 'children')}, starting with ${firstChildName}.`
    : 'Add a child profile to start tracking family health.';
  const avatar = (
    <div className="topbar-avatar" aria-label="Profile">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="topbar-avatar__image" />
      ) : (
        <span>{getInitials(profile?.full_name)}</span>
      )}
    </div>
  );

  return (
    <div className="home">
      <div className="home__header-bg" aria-hidden="true" />

      <TopNavBar transparent extra={avatar} />

      <div className="home__greeting">
        <p className="home__greeting-hi brand-font">{greeting}</p>
        <p className="home__greeting-sub">Let's check on your family</p>
      </div>

      <section className="home__progress-card">
        <div className="home__progress-row">
          <div className="home__ring-wrap">
            <svg viewBox="0 0 120 120" width="110" height="110">
              <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="10" className="home__ring-track" />
              <circle
                cx="60" cy="60" r={RING_R}
                fill="none" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 60 60)"
                className="home__ring-fill"
              />
            </svg>
            <span className="home__ring-label">{progressPct}%</span>
          </div>
          <div className="home__progress-info">
            <p className="home__progress-eyebrow">Your Progress</p>
            <p className="home__progress-detail">{progressDetail}</p>
            <p className="home__progress-child">{childSummary}</p>
            <p className="home__progress-date">{today}</p>
          </div>
        </div>

        <div className="home__stats-row">
          <div className="home__stat">
            <span className="home__stat-value">{childCount}</span>
            <span className="home__stat-label">Children</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">0</span>
            <span className="home__stat-label">Total Logs</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">None</span>
            <span className="home__stat-label">Next Visit</span>
          </div>
        </div>
      </section>

      <section className="home__section home__section--carousel">
        <div className="home__section-header">
          <h3 className="home__section-title brand-font">Dashboard Widgets</h3>
        </div>
        <DashboardMetricsCarousel />
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title brand-font">Recent Logs</h3>
          <button className="home__see-all" onClick={onNavigateToSymptoms}>Add log</button>
        </div>
        <div className="home__logs">
          {recentLogs.length === 0 ? (
            <div className="home__empty-card">
              <p className="home__empty-title">No symptom logs yet</p>
              <p className="home__empty-body">
                Tap "Add log" to start recording symptoms for your child's next doctor visit.
              </p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="home__log-card">
                <FileText size={16} strokeWidth={2} className="home__log-icon" />
                <div className="home__log-info">
                  <p className="home__log-complaint">{log.chief_complaint || 'In progress...'}</p>
                  <p className="home__log-date">
                    {new Date(log.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {log.status === 'in_progress' && ' • Draft'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title brand-font">Health Tips</h3>
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
    </div>
  );
}
