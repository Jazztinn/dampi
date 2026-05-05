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

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DP';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

function formatMemberSince(value) {
  if (!value) return 'Recently joined';
  return new Date(value).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

function getAgeLabel(dateOfBirth) {
  if (!dateOfBirth) return 'Age not set';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  if (Number.isNaN(years) || years < 0) return 'Age not set';
  return years === 1 ? '1 year old' : `${years} years old`;
}

export default function FinancialAssistanceScreen({ profile, child }) {
  const fullName = profile?.full_name || 'Dampi Parent';
  const childName = child?.full_name || 'Child profile';
  const patientId = profile?.id ? `DMPI-${profile.id.slice(0, 8).toUpperCase()}` : 'DMPI-PENDING';
  const infoRows = [
    {
      id: 1,
      Icon: Phone,
      label: 'Contact',
      value: profile?.phone || 'Not provided',
    },
    {
      id: 2,
      Icon: MapPin,
      label: 'Preferred Clinic',
      value: 'Not set yet',
    },
    {
      id: 3,
      Icon: Calendar,
      label: 'Member Since',
      value: formatMemberSince(profile?.created_at),
    },
  ];

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
          <span>{getInitials(fullName)}</span>
        </div>
        <div className="profile__identity-copy">
          <p className="profile__name">{fullName}</p>
          <p className="profile__meta">Parent guardian · Patient ID: {patientId}</p>
        </div>
        <span className="profile__status">Verified</span>
      </section>

      <section className="profile__summary-grid">
        <article>
          <p>Child</p>
          <strong>{childName}</strong>
          <span>{getAgeLabel(child?.date_of_birth)}</span>
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
          {infoRows.map(({ id, Icon, label, value }) => (
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
