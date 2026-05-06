import { ChevronLeft } from 'lucide-react';
import './top-nav-bar.css';

export default function TopNavBar({ variant = 'inner', title, onBack }) {
  if (variant === 'home') {
    return (
      <div className="top-nav top-nav--home">
        <div className="top-nav__greeting">
          <p className="top-nav__hi">Hi, Juan!</p>
          <p className="top-nav__sub">Let's check on your family</p>
        </div>
        <div className="top-nav__avatar" aria-label="Profile">
          <span className="top-nav__avatar-initials">JD</span>
        </div>
      </div>
    );
  }

  return (
    <div className="top-nav top-nav--inner">
      <div className="top-nav__dots" aria-hidden="true">
        <span className="top-nav__dot top-nav__dot--close" />
        <span className="top-nav__dot top-nav__dot--minimize" />
        <span className="top-nav__dot top-nav__dot--expand" />
      </div>
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
