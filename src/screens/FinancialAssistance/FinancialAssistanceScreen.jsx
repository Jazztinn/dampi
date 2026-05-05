import { Phone, MapPin, Calendar, FileText, ChevronRight } from 'lucide-react';
import './financial-assistance.css';

const INFO_ROWS = [
  {
    id: 1,
    Icon: Phone,
    label: 'Contact',
    value: '+63 XXX XXX XXXX',
  },
  {
    id: 2,
    Icon: MapPin,
    label: 'Address',
    value: 'Lorem Ipsum St., Dolor, Manila',
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
    Icon: FileText,
    title: 'Financial Assistance',
    desc: 'Lorem ipsum dolor sit amet consectetur adipiscing',
  },
  {
    id: 2,
    iconClass: 'warm',
    Icon: FileText,
    title: 'Document Requests',
    desc: 'Ut enim ad minim veniam quis nostrud exercitation',
  },
];

export default function FinancialAssistanceScreen() {
  return (
    <div className="profile">
      <div className="profile__statusbar" />

      <header className="profile__header">
        <h1 className="profile__title">My Profile</h1>
      </header>

      {/* Avatar + identity */}
      <div className="profile__identity">
        <div className="profile__avatar">
          <span className="profile__avatar-initials">JD</span>
        </div>
        <div>
          <p className="profile__name">Juan Dela Cruz</p>
          <p className="profile__meta">
            Lorem ipsum · Patient ID: DMPI-0001
          </p>
        </div>
      </div>

      {/* Info rows */}
      <p className="profile__section-title">Personal Information</p>
      <div className="profile__info-list">
        {INFO_ROWS.map(({ id, Icon, label, value }) => (
          <div key={id} className="profile__info-row">
            <div className="profile__info-icon">
              <Icon size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="profile__info-label">{label}</p>
              <p className="profile__info-value">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action cards */}
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
            <ChevronRight size={18} color="var(--dampi-text-muted)" strokeWidth={2} />
          </button>
        ))}
      </div>

      <div style={{ height: '120px' }} />
    </div>
  );
}
