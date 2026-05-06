import { Heart, Stethoscope, Pill, Eye, Activity } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './hmo-portal.css';

const BENEFITS = [
  {
    id: 1,
    Icon: Stethoscope,
    name: 'Outpatient Consultation',
    desc: 'Lorem ipsum dolor sit amet consectetur',
    limit: '₱500/visit',
  },
  {
    id: 2,
    Icon: Heart,
    name: 'Emergency Care',
    desc: 'Ut enim ad minim veniam quis nostrud',
    limit: '₱10,000',
  },
  {
    id: 3,
    Icon: Pill,
    name: 'Medicines',
    desc: 'Duis aute irure dolor in reprehenderit',
    limit: '₱2,000/mo',
  },
  {
    id: 4,
    Icon: Eye,
    name: 'Annual Check-up',
    desc: 'Excepteur sint occaecat cupidatat non',
    limit: 'Included',
  },
];

export default function HMOPortalScreen({ onBack }) {
  return (
    <div className="hmo-portal">
      <TopNavBar variant="inner" title="HMO Portal" onBack={onBack} />

      {/* Coverage status card */}
      <div className="hmo-portal__coverage-card">
        <p className="hmo-portal__coverage-label">PhilHealth / HMO Plan</p>
        <p className="hmo-portal__coverage-status">Coverage Active</p>
        <p className="hmo-portal__coverage-meta">
          Coverage details will appear after provider integration is connected.
        </p>
        <div className="hmo-portal__coverage-badge">
          <span className="hmo-portal__coverage-dot" />
          Active Member
        </div>
      </div>

      {/* Benefits list */}
      <p className="hmo-portal__section-title">Your Benefits</p>
      <div className="hmo-portal__benefits">
        {BENEFITS.map(({ id, Icon, name, desc, limit }) => (
          <div key={id} className="hmo-portal__benefit-item">
            <div className="hmo-portal__benefit-icon">
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="hmo-portal__benefit-info">
              <p className="hmo-portal__benefit-name">{name}</p>
              <p className="hmo-portal__benefit-desc">{desc}</p>
            </div>
            <span className="hmo-portal__benefit-limit">{limit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
