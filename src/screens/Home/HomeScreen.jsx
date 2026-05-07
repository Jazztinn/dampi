import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
  FileText,
  Baby,
  Plus,
  X,
  CheckCircle2,
  Activity,
  Ruler,
  Pill,
  Calendar,
} from 'lucide-react';
import TopNavBar, { getFirstName, getInitials } from '../../navigation/TopNavBar.jsx';
import DashboardMetricsCarousel from '../../components/DashboardMetricsCarousel.jsx';
import { loadSymptomLogs } from '../../services/symptomLog/symptomLogPersistence.js';
import './home-screen.css';

const HEALTH_TIPS = [
  { id: 1, Icon: Droplets, title: 'Stay Hydrated', body: 'Offer warm fluids to help your child stay healthy and comfortable.' },
  { id: 2, Icon: Thermometer, title: 'Check Temperature', body: 'Use a thermometer for accurate readings. Normal range: 36.5-37.5 C.' },
  { id: 3, Icon: Wind, title: 'Fresh Air', body: 'Keep rooms ventilated and dress warmly, but avoid overheating.' },
];

const AVAILABLE_WIDGETS = [
  { id: 'vitals', title: 'Last Vitals', Icon: Activity, type: 'metric' },
  { id: 'growth', title: 'Growth', Icon: Ruler, type: 'metric' },
  { id: 'meds', title: 'Medications', Icon: Pill, type: 'metric' },
  { id: 'appointments', title: 'Upcoming', Icon: Calendar, type: 'metric' },
];

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export default function HomeScreen({ 
  profile, 
  child, 
  children = [], 
  onNavigateToSymptoms, 
  onNavigateToChildRegistration, 
  onChildrenChange 
}) {
  const [recentLogs, setRecentLogs] = useState([]);
  const [totalLogCount, setTotalLogCount] = useState(0);
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const saved = localStorage.getItem('dampi.activeWidgets');
    return saved ? JSON.parse(saved) : ['vitals', 'growth'];
  });
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  useEffect(() => {
    localStorage.setItem('dampi.activeWidgets', JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  useEffect(() => {
    const refreshLogs = async () => {
      try {
        const logs = await loadSymptomLogs(null, 5);
        setRecentLogs(logs || []);
        const allLogs = await loadSymptomLogs(null, 1000);
        setTotalLogCount(allLogs?.length || 0);
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    };
    
    refreshLogs();
    window.addEventListener('dampi:symptom-log-saved', refreshLogs);
    return () => window.removeEventListener('dampi:symptom-log-saved', refreshLogs);
  }, []);

  const childCount = children.length || (child ? 1 : 0);
  const firstName = getFirstName(profile?.full_name);
  const greeting = firstName ? `Hi, ${firstName}!` : 'Hi there!';
  const activeChild = child || children[0];
  const firstChildName = activeChild?.full_name || 'your child';
  const isRegistrationIncomplete = activeChild && !activeChild.registration_completed;

  const toggleWidget = (id) => {
    setActiveWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

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
          <div className="home__profile-photo">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="home__profile-image" />
            ) : (
              <span className="home__profile-initials">{getInitials(profile?.full_name)}</span>
            )}
          </div>
          <div className="home__progress-info">
            <div className="home__progress-stats">
              <div className="home__progress-stat">
                <Baby size={14} className="home__stat-icon" />
                <span>Tracking <strong>{childCount}</strong> {pluralize(childCount, 'child', 'children')}</span>
              </div>
              <div className="home__progress-stat">
                <FileText size={14} className="home__stat-icon" />
                <span><strong>{totalLogCount}</strong> {pluralize(totalLogCount, 'log', 'logs')} recorded</span>
              </div>
            </div>
          </div>
        </div>

        {isRegistrationIncomplete && (
          <>
            <div className="home__card-divider" />
            <div className="home__registration-reminder" onClick={() => onNavigateToChildRegistration?.(activeChild.id)}>
              <div className="home__registration-content">
                <div className="home__registration-icon">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="home__registration-title">Finish {firstChildName}'s Registration</p>
                  <p className="home__registration-sub">Get better AI guidance.</p>
                </div>
              </div>
              <div className="home__registration-action">
                <span>Continue</span>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="home__section home__section--carousel">
        <div className="home__section-header">
          <h3 className="home__section-title brand-font">Dashboard Widgets</h3>
          <button 
            className="home__add-widget" 
            onClick={() => setShowWidgetPicker(true)}
            aria-label="Add widget"
          >
            <Plus size={18} />
          </button>
        </div>
        <DashboardMetricsCarousel 
          profile={profile} 
          child={activeChild} 
          children={children} 
          onChildrenChange={onChildrenChange}
          activeWidgetIds={activeWidgets}
          recentLogs={recentLogs}
        />
      </section>

      {showWidgetPicker && (
        <div className="home__modal-overlay" onClick={() => setShowWidgetPicker(false)}>
          <div className="home__widget-picker" onClick={e => e.stopPropagation()}>
            <div className="home__picker-header">
              <h4 className="brand-font">Choose Widgets</h4>
              <button className="home__picker-close" onClick={() => setShowWidgetPicker(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="home__picker-grid">
              {AVAILABLE_WIDGETS.map(w => (
                <button 
                  key={w.id} 
                  className={`home__picker-item ${activeWidgets.includes(w.id) ? 'active' : ''}`}
                  onClick={() => toggleWidget(w.id)}
                >
                  <div className="home__picker-icon">
                    <w.Icon size={20} />
                  </div>
                  <span className="home__picker-label">{w.title}</span>
                  <div className="home__picker-check">
                    <CheckCircle2 size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
