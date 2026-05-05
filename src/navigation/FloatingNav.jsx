import { useState } from 'react';
import { House, ClipboardList, Shield, User } from 'lucide-react';
import dampiLogo from '../assets/dampi.svg';
import './floating-nav.css';

const NAV_ITEMS = [
  { id: 'home',     Icon: House,         label: 'Home'     },
  { id: 'symptoms', Icon: ClipboardList, label: 'Symptoms' },
  { id: 'hmo',      Icon: Shield,        label: 'HMO'      },
  { id: 'profile',  Icon: User,          label: 'Profile'  },
];

export default function FloatingNav({ currentScreen, onNavigate }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded(prev => !prev);

  const handleItemClick = (id) => {
    onNavigate(id);
    setExpanded(false);
  };

  return (
    <>
      {/* Invisible backdrop to close on outside tap */}
      {expanded && (
        <div
          className="floating-nav__backdrop"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={`floating-nav${expanded ? ' is-expanded' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo toggle button */}
        <button
          className="floating-nav__logo-btn"
          onClick={toggle}
          aria-label={expanded ? 'Close navigation' : 'Open navigation'}
          aria-expanded={expanded}
        >
          <img
            src={dampiLogo}
            alt="Dampi"
            className="floating-nav__logo-img"
          />
        </button>

        {/* Nav items rail (hidden when collapsed) */}
        <div className="floating-nav__rail" role="list">
          {NAV_ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              className={`floating-nav__item${currentScreen === id ? ' is-active' : ''}`}
              onClick={() => handleItemClick(id)}
              aria-label={label}
              aria-current={currentScreen === id ? 'page' : undefined}
              role="listitem"
            >
              <span className="floating-nav__item-icon">
                <Icon size={18} strokeWidth={currentScreen === id ? 2.5 : 2} />
              </span>
              <span className="floating-nav__item-label">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
