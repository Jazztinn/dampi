import { ChevronLeft } from 'lucide-react';
import './top-nav-bar.css';

export default function TopNavBar({ variant, title, onBack, extra, transparent }) {
  if (variant === 'inner') {
    return (
      <div className="top-nav top-nav--inner">
        <button className="top-nav__back" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <p className="top-nav__title">{title ?? ''}</p>
        <div className="top-nav__filler" aria-hidden="true" />
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
