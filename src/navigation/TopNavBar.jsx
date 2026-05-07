import { ChevronLeft } from 'lucide-react';
import './top-nav-bar.css';

export function getFirstName(fullName) {
  return fullName?.trim().split(/\s+/)[0] || '';
}

export function getInitials(fullName) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) || [];
  if (!parts.length) return 'D';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function TopNavBar({ variant, title, onBack, extra, transparent }) {
  if (variant === 'inner') {
    return (
      <div className={`top-nav top-nav--inner${transparent ? ' top-nav--transparent' : ''}`}>
        <div className="top-nav__left" style={{ visibility: onBack ? 'visible' : 'hidden' }}>
          <button type="button" className="top-nav__back" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        {typeof title === 'string' ? (
          <p className="top-nav__title">{title}</p>
        ) : (
          <div className="top-nav__center">{title}</div>
        )}
        
        {extra ? (
          <div className="top-nav__right">{extra}</div>
        ) : (
          <div className="top-nav__filler" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div className={`topbar${transparent ? ' topbar--transparent' : ''}`}>
      <div className="topbar-left">
        <span className="topbar-wordmark">dampi</span>
      </div>
      <div className="topbar-right">
        {extra}
      </div>
    </div>
  );
}
