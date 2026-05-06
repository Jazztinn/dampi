import TopNavBar from '../../navigation/TopNavBar.jsx';
import DashboardMetricsCarousel from '../../components/DashboardMetricsCarousel.jsx';
import './home-screen.css';
import { useMemo } from 'react';

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

const today = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
});

export default function HomeScreen({ profile, child }) {
  const progressData = useMemo(() => {
    if (!profile) return { percent: 0, completed: 0, total: 0 };
    const fields = ['age', 'gender', 'medicalHistory', 'allergies'];
    const completed = fields.filter(f => profile[f]).length;
    const total = fields.length;
    return { percent: Math.round((completed / total) * 100), completed, total };
  }, [profile]);

  const childrenCount = useMemo(() => {
    if (!Array.isArray(child)) return 0;
    return child.length;
  }, [child]);

  const ringOffset = RING_C * (1 - progressData.percent / 100);

  const avatar = (
    <div className="topbar-avatar">
      <span>JD</span>
    </div>
  );

  return (
    <div className="home">
      <div className="home__header-bg" aria-hidden="true" />

      <TopNavBar transparent extra={avatar} />

      <div className="home__greeting">
        <p className="home__greeting-hi">Hi, Juan!</p>
        <p className="home__greeting-sub">Let's check on your family</p>
      </div>

      {/* Progress card */}
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
            <span className="home__ring-label">{progressData.percent}%</span>
          </div>
          <div className="home__progress-info">
            <p className="home__progress-eyebrow">Your Progress</p>
            <p className="home__progress-detail">{progressData.completed} of {progressData.total} profiles complete</p>
            <p className="home__progress-date">{today}</p>
          </div>
        </div>

        <div className="home__stats-row">
          <div className="home__stat">
            <span className="home__stat-value">{childrenCount}</span>
            <span className="home__stat-label">Children</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">—</span>
            <span className="home__stat-label">Total Logs</span>
          </div>
          <div className="home__stat-divider" />
          <div className="home__stat">
            <span className="home__stat-value">—</span>
            <span className="home__stat-label">Next Visit</span>
          </div>
        </div>
      </section>

      {/* Health Overview Carousel */}
      <section className="home__section home__section--carousel">
        <div className="home__section-header">
          <h3 className="home__section-title">Health Overview</h3>
        </div>
        <DashboardMetricsCarousel />
      </section>
    </div>
  );
}
