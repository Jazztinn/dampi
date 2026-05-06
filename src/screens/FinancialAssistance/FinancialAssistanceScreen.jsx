import { Phone, Calendar, Baby, FileText, ChevronRight, LogOut } from 'lucide-react';
import TopNavBar, { getInitials } from '../../navigation/TopNavBar.jsx';
import './financial-assistance.css';

const ACTIONS = [
  {
    id: 1,
    iconClass: 'sage',
    Icon: FileText,
    title: 'Financial Assistance',
    desc: 'Review available support options for your household.',
  },
  {
    id: 2,
    iconClass: 'warm',
    Icon: FileText,
    title: 'Document Requests',
    desc: 'Prepare documents tied to your Dampi profile.',
  },
];

function formatDate(date) {
  if (!date) return 'Not available';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatRole(role) {
  return role
    ? role.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Caregiver';
}

export default function FinancialAssistanceScreen({ profile, child, children = [], onBack, onSignOut }) {
  const fullName = profile?.full_name || 'Dampi caregiver';
  const childCount = children.length || (child ? 1 : 0);
  const primaryChildName = child?.full_name || children[0]?.full_name || 'No child profile';
  const infoRows = [
    {
      id: 'contact',
      Icon: Phone,
      label: 'Contact',
      value: profile?.phone || 'Not provided',
    },
    {
      id: 'children',
      Icon: Baby,
      label: childCount === 1 ? 'Child Profile' : 'Child Profiles',
      value: childCount > 1 ? `${childCount} children linked` : primaryChildName,
    },
    {
      id: 'member-since',
      Icon: Calendar,
      label: 'Member Since',
      value: formatDate(profile?.created_at),
    },
  ];

  return (
    <div className="profile">
      <TopNavBar variant="inner" title="My Profile" onBack={onBack} />

      <div className="profile__identity">
        <div className="profile__avatar">
          <span className="profile__avatar-initials">{getInitials(profile?.full_name)}</span>
        </div>
        <div>
          <p className="profile__name">{fullName}</p>
          <p className="profile__meta">
            {formatRole(profile?.role)}
          </p>
        </div>
      </div>

      <p className="profile__section-title">Personal Information</p>
      <div className="profile__info-list">
        {infoRows.map(({ id, Icon, label, value }) => (
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

      <div className="profile__sign-out-row">
        <button className="profile__sign-out-btn" onClick={onSignOut}>
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
