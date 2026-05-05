import {
  Calendar,
  ChevronRight,
  FileCheck,
  FileText,
  HandCoins,
  MapPin,
  Phone,
  UserCircle,
} from 'lucide-react';
import './financial-assistance.css';

const INFO_ROWS = [
  {
    id: 1,
    Icon: Phone,
    label: 'Contact',
    value: '+63 917 204 1138',
  },
  {
    id: 2,
    Icon: MapPin,
    label: 'Preferred Clinic',
    value: 'Barangay Health Center, Manila',
  },
  {
    id: 3,
    Icon: Calendar,
    label: 'Member Since',
    value: 'January 2024',
  },
];

const ACTIONS = [
  {
    id: 1,
    iconClass: 'sage',
    Icon: HandCoins,
    title: 'Financial Assistance',
    desc: 'Check subsidy options and required documents.',
  },
  {
    id: 2,
    iconClass: 'warm',
    Icon: FileText,
    title: 'Document Requests',
    desc: 'Prepare certificates, receipts, and clinic forms.',
  },
  {
    id: 3,
    iconClass: 'blue',
    Icon: FileCheck,
    title: 'Claim Readiness',
    desc: 'Review what is missing before filing.',
  },
];

export default function FinancialAssistanceScreen() {
  return (
    <div className="profile">
      <div className="profile__statusbar" />

      <header className="profile__header">
        <div>
          <p className="profile__eyebrow">Family profile</p>
          <h1>My Profile</h1>
          <p>Keep care contacts, coverage, and assistance steps ready.</p>
        </div>
        <button className="profile__icon-btn" aria-label="Profile settings">
          <UserCircle size={20} />
        </button>
      </header>

      <section className="profile__identity">
        <div className="profile__avatar">
          <span>JD</span>
        </div>
        <div className="profile__identity-copy">
          <p className="profile__name">Juan Dela Cruz</p>
          <p className="profile__meta">Parent guardian · Patient ID: DMPI-0001</p>
        </div>
        <span className="profile__status">Verified</span>
      </section>

      <section className="profile__summary-grid">
        <article>
          <p>Child</p>
          <strong>Melani</strong>
          <span>5 years old</span>
        </article>
        <article>
          <p>Coverage</p>
          <strong>Active</strong>
          <span>HMO + public aid</span>
        </article>
      </section>

      <section>
        <p className="profile__section-title">Personal information</p>
        <div className="profile__info-list">
          {INFO_ROWS.map(({ id, Icon, label, value }) => (
            <article key={id} className="profile__info-row">
              <div className="profile__info-icon">
                <Icon size={16} strokeWidth={2} />
              </div>
              <div>
                <p className="profile__info-label">{label}</p>
                <p className="profile__info-value">{value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="profile__section-title">Assistance</p>
        <div className="profile__actions">
          {ACTIONS.map(({ id, iconClass, Icon, title, desc }) => (
            <button key={id} className="profile__action-card">
              <div className={`profile__action-icon profile__action-icon--${iconClass}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="profile__action-text">
                <p className="profile__action-title">{title}</p>
                <p className="profile__action-desc">{desc}</p>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" strokeWidth={2} />
            </button>
          ))}
        </div>
      </section>

      <div className="profile__bottom-space" aria-hidden="true" />
    </div>
  );
}
