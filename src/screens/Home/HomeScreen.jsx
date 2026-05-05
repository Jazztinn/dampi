import {
  ClipboardList,
  Calendar,
  MapPin,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Droplets,
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

const TIPS = [
  {
    id: 1,
    Icon: Droplets,
    title: 'Hydration',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Bibendum nisl diam.',
  },
  {
    id: 2,
    Icon: Stethoscope,
    title: 'Regular Check-ups',
    body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.',
  },
  {
    id: 3,
    Icon: Wind,
    title: 'Fresh Air',
    body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
  },
];

export default function HomeScreen() {
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

      {/* ── Hero card ── */}
      <section className="home__hero-card">
        {/* Decorative blob */}
        <div className="home__hero-blob" aria-hidden="true" />

        <div className="home__hero-content">
          <p className="home__hero-eyebrow">Daily Check-in</p>
          <h2 className="home__hero-title">How is your child today?</h2>
          <p className="home__hero-sub">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam.
          </p>
          <button className="home__hero-cta">
            Log Symptoms
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

      {/* ── Upcoming Visit ── */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Upcoming Visit</h3>
          <button className="home__see-all">See all</button>
        </div>

        <div className="home__visit-card">
          <div className="home__visit-date-badge">
            <span className="home__visit-month">JUN</span>
            <span className="home__visit-day">12</span>
          </div>
          <div className="home__visit-info">
            <p className="home__visit-name">Dr. Lorem Ipsum</p>
            <p className="home__visit-detail">Pediatrics · 9:00 AM</p>
            <p className="home__visit-location">Dolor Sit Amet Clinic, Manila</p>
          </div>
          <div className="home__visit-status">Confirmed</div>
        </div>
      </section>

      {/* ── Health Tips ── */}
      <section className="home__section">
        <div className="home__section-header">
          <h3 className="home__section-title">Health Tips</h3>
          <button className="home__see-all">See all</button>
        </div>

        <div className="home__tips-scroll">
          {TIPS.map(({ id, Icon, title, body }) => (
            <div key={id} className="home__tip-card">
              <div className="home__tip-icon-wrap">
                <Icon size={20} strokeWidth={2} color="var(--dampi-teal)" />
              </div>
              <p className="home__tip-title">{title}</p>
              <p className="home__tip-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom padding for floating nav ── */}
      <div style={{ height: '120px' }} />
    </div>
  );
}
