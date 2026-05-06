import {
  AlertCircle,
  ChevronRight,
  Droplets,
  Ear,
  HeartPulse,
  Search,
  Thermometer,
  Wind,
} from 'lucide-react';
import './symptom-guide.css';

const CATEGORIES = [
  {
    id: 1,
    Icon: Wind,
    tone: 'blue',
    name: 'Cough and Breathing',
    desc: 'Track cough, wheezing, fast breathing, or chest effort.',
    count: '12 guides',
  },
  {
    id: 2,
    Icon: Thermometer,
    tone: 'warm',
    name: 'Fever and Infection',
    desc: 'Know when fever needs home care, clinic care, or urgent care.',
    count: '15 guides',
  },
  {
    id: 3,
    Icon: Droplets,
    tone: 'sage',
    name: 'Stomach and Hydration',
    desc: 'Vomiting, diarrhea, urine output, and dehydration signs.',
    count: '8 guides',
  },
  {
    id: 4,
    Icon: Ear,
    tone: 'green',
    name: 'Ear, Skin, and Rashes',
    desc: 'Rashes, itch, ear pain, swelling, and common child complaints.',
    count: '10 guides',
  },
];

const RED_FLAGS = ['Hirap huminga', 'Blue lips', 'Very sleepy', 'No urine 8+ hrs'];

export default function SymptomGuideScreen() {
  return (
    <div className="symptom-guide">
      <div className="symptom-guide__statusbar" />

      <header className="symptom-guide__header">
        <div>
          <p className="symptom-guide__eyebrow">Symptom Guide</p>
          <h1>What are you seeing today?</h1>
          <p>Choose a body system, then log clear notes your doctor can use.</p>
        </div>
        <button className="symptom-guide__round-btn" aria-label="Urgent symptom notes">
          <AlertCircle size={19} />
        </button>
      </header>

      <section className="symptom-guide__hero">
        <div className="symptom-guide__risk-ring" aria-label="Low risk guidance">
          <HeartPulse size={25} />
          <span>Low</span>
        </div>
        <div>
          <p className="symptom-guide__eyebrow">Smart triage</p>
          <h2>Start with symptoms, then check red flags.</h2>
          <p>Dampi helps organize what changed, when it started, and what needs urgent attention.</p>
        </div>
      </section>

      <div className="symptom-guide__search">
        <Search size={17} className="symptom-guide__search-icon" strokeWidth={2} />
        <input
          className="symptom-guide__search-input"
          type="search"
          placeholder="Search cough, fever, rash, vomiting..."
          readOnly
        />
      </div>

      <section className="symptom-guide__red-flags">
        <p className="symptom-guide__section-title">Urgent red flags</p>
        <div className="symptom-guide__chips">
          {RED_FLAGS.map((flag) => (
            <span key={flag}>{flag}</span>
          ))}
        </div>
      </section>

      <section>
        <p className="symptom-guide__section-title">Browse categories</p>
        <div className="symptom-guide__categories">
          {CATEGORIES.map(({ id, Icon, tone, name, desc, count }) => (
            <button key={id} className="symptom-guide__category-card">
              <span className={`symptom-guide__cat-icon symptom-guide__cat-icon--${tone}`}>
                <Icon size={19} />
              </span>
              <div className="symptom-guide__cat-info">
                <p className="symptom-guide__cat-name">{name}</p>
                <p className="symptom-guide__cat-desc">{desc}</p>
              </div>
              <span className="symptom-guide__cat-count">{count}</span>
              <ChevronRight size={16} color="var(--text-muted)" strokeWidth={2} />
            </button>
          ))}
        </div>
      </section>

      <div className="symptom-guide__bottom-space" aria-hidden="true" />
    </div>
  );
}
