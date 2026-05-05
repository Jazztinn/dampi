import { Heart, Users, ClipboardList } from 'lucide-react';

export default function WelcomeScreen({ onNext }) {
  return (
    <div className="onboarding-screen-content">
      <div className="welcome-header">
        <div className="welcome-logo">
          <Heart size={48} strokeWidth={1.5} />
        </div>
        <h1 className="welcome-title">Dampi</h1>
        <p className="welcome-subtitle">Family Health Journal</p>
      </div>

      <div className="welcome-features">
        <div className="feature">
          <ClipboardList size={32} />
          <h3>Log Essentials</h3>
          <p>Track health observations for your children</p>
        </div>
        <div className="feature">
          <Users size={32} />
          <h3>Family Together</h3>
          <p>Invite caregivers to help track health</p>
        </div>
        <div className="feature">
          <Heart size={32} />
          <h3>Health & Wellness</h3>
          <p>Medical and mental health in one place</p>
        </div>
      </div>

      <button className="onboarding-cta" onClick={() => onNext()}>
        Get Started
      </button>

      <p className="welcome-legal">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
