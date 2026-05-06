import {
  CalendarCheck,
  FileText,
  Heart,
  Pill,
  ShieldCheck,
  Stethoscope,
  WalletCards,
} from 'lucide-react';
import { Heart, Stethoscope, Pill, Eye, Activity } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './hmo-portal.css';

const BENEFITS = [
  {
    id: 1,
    Icon: Stethoscope,
    name: 'Outpatient Consultation',
    desc: 'Pediatric checkups and follow-up visits',
    limit: 'PHP 500/visit',
  },
  {
    id: 2,
    Icon: Heart,
    name: 'Emergency Care',
    desc: 'ER support for urgent pediatric symptoms',
    limit: 'PHP 10,000',
  },
  {
    id: 3,
    Icon: Pill,
    name: 'Medicines',
    desc: 'Covered prescriptions after consult',
    limit: 'PHP 2,000/mo',
  },
  {
    id: 4,
    Icon: FileText,
    name: 'Claims Documents',
    desc: 'LOA, receipts, and reimbursement checklist',
    limit: 'Ready',
  },
];

const METRICS = [
  { label: 'Available', value: '82%', helper: 'Plan balance' },
  { label: 'Visits', value: '3', helper: 'Remaining this month' },
  { label: 'Claims', value: '1', helper: 'Pending review' },
];

export default function HMOPortalScreen() {
  return (
    <div className="hmo-portal">
      <div className="hmo-portal__statusbar" />

      <header className="hmo-portal__header">
        <div>
          <p className="hmo-portal__eyebrow">Coverage</p>
          <h1>HMO Portal</h1>
          <p>Keep benefits, clinic requirements, and documents in one parent-friendly view.</p>
        </div>
        <button className="hmo-portal__icon-btn" aria-label="Coverage card">
          <WalletCards size={19} />
        </button>
      </header>
export default function HMOPortalScreen({ onBack }) {
  return (
    <div className="hmo-portal">
      <TopNavBar variant="inner" title="HMO Portal" onBack={onBack} />

      <section className="hmo-portal__coverage-card">
        <div className="hmo-portal__coverage-icon">
          <ShieldCheck size={28} />
        </div>
        <p className="hmo-portal__coverage-label">PhilHealth / HMO Plan</p>
        <h2>Coverage Active</h2>
        <p>Valid until December 31, 2026 · ID: DMPI-2048</p>
        <span className="hmo-portal__coverage-badge">
          <span className="hmo-portal__coverage-dot" />
          Active Member
        </span>
      </section>

      <section className="hmo-portal__metrics">
        {METRICS.map(({ label, value, helper }) => (
          <article key={label} className="hmo-portal__metric-card">
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{helper}</span>
          </article>
        ))}
      </section>

      <section className="hmo-portal__visit-card">
        <CalendarCheck size={22} />
        <div>
          <p className="hmo-portal__eyebrow">Next step</p>
          <h2>Bring LOA and previous symptom log.</h2>
          <p>Recommended before the next pediatric consultation.</p>
        </div>
      </section>

      <section>
        <p className="hmo-portal__section-title">Your benefits</p>
        <div className="hmo-portal__benefits">
          {BENEFITS.map(({ id, Icon, name, desc, limit }) => (
            <article key={id} className="hmo-portal__benefit-item">
              <div className="hmo-portal__benefit-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="hmo-portal__benefit-info">
                <p className="hmo-portal__benefit-name">{name}</p>
                <p className="hmo-portal__benefit-desc">{desc}</p>
              </div>
              <span className="hmo-portal__benefit-limit">{limit}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="hmo-portal__bottom-space" aria-hidden="true" />
    </div>
  );
}
