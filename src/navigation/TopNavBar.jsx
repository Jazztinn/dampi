import { ChevronDown, MoreHorizontal } from 'lucide-react';
import './top-nav-bar.css';

export default function TopNavBar() {
  return (
    <div className="top-navigation-bar">
      <div className="top-navigation-icons">
        <button className="icon-btn">
          <ChevronDown size={28} strokeWidth={2} color="white" />
        </button>
        <button className="icon-btn">
          <MoreHorizontal size={28} strokeWidth={2} color="white" />
        </button>
      </div>
    </div>
  );
}
