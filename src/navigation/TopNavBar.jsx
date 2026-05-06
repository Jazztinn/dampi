import { ChevronLeft } from 'lucide-react';
import './top-nav-bar.css';

function getFirstName(fullName) {
  return fullName?.trim().split(/\s+/)[0] || '';
}

function getInitials(fullName) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) || [];
  if (!parts.length) return 'D';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function TopNavBar({ variant = 'inner', title, profile, onBack }) {
  if (variant === 'home') {
    const firstName = getFirstName(profile?.full_name);
    const greeting = firstName ? `Hi, ${firstName}!` : 'Hi there!';

    return (
      <div className="top-nav top-nav--home">
        <div className="top-nav__greeting">
          <p className="top-nav__hi">{greeting}</p>
          <p className="top-nav__sub">Let's check on your family</p>
        </div>
        <div className="top-nav__avatar" aria-label="Profile">
          <span className="top-nav__avatar-initials">{getInitials(profile?.full_name)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="top-nav top-nav--inner">
      <button
        className="top-nav__back"
        onClick={onBack}
        aria-label="Go back"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <p className="top-nav__title">{title ?? ''}</p>
      <div className="top-nav__filler" aria-hidden="true" />
    </div>
  );
}
