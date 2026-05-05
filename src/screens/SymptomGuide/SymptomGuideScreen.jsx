import { Search, ChevronRight } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './symptom-guide.css';

const CATEGORIES = [
  {
    id: 1,
    dot: 'sage',
    name: 'Respiratory',
    desc: 'Lorem ipsum dolor sit amet consectetur',
    count: '12 guides',
  },
  {
    id: 2,
    dot: 'teal',
    name: 'Gastrointestinal',
    desc: 'Ut enim ad minim veniam quis nostrud',
    count: '8 guides',
  },
  {
    id: 3,
    dot: 'warm',
    name: 'Fever & Infections',
    desc: 'Duis aute irure dolor in reprehenderit',
    count: '15 guides',
  },
  {
    id: 4,
    dot: 'emergency',
    name: 'Skin Conditions',
    desc: 'Excepteur sint occaecat cupidatat non',
    count: '6 guides',
  },
];

export default function SymptomGuideScreen({ onBack }) {
  return (
    <div className="symptom-guide">
      <TopNavBar variant="inner" title="Symptom Guide" onBack={onBack} />

      {/* Search bar */}
      <div className="symptom-guide__search">
        <Search
          size={17}
          className="symptom-guide__search-icon"
          strokeWidth={2}
        />
        <input
          className="symptom-guide__search-input"
          type="search"
          placeholder="Search symptoms or conditions…"
          readOnly
        />
      </div>

      {/* Category list */}
      <p className="symptom-guide__section-title">Browse Categories</p>
      <div className="symptom-guide__categories">
        {CATEGORIES.map(({ id, dot, name, desc, count }) => (
          <button key={id} className="symptom-guide__category-card">
            <span className={`symptom-guide__dot symptom-guide__dot--${dot}`} />
            <div className="symptom-guide__cat-info">
              <p className="symptom-guide__cat-name">{name}</p>
              <p className="symptom-guide__cat-desc">{desc}</p>
            </div>
            <span className="symptom-guide__cat-count">{count}</span>
            <ChevronRight size={16} color="var(--dampi-text-muted)" strokeWidth={2} />
          </button>
        ))}
      </div>

      <div style={{ height: '120px' }} />
    </div>
  );
}
