import { Heart, Users, ClipboardList } from 'lucide-react';
import dampiLogo from '../../assets/dampi.svg';

export default function WelcomeScreen({ onNext }) {
  return (
    <div className="onboarding-screen-content">
      <div className="welcome-header">
        <div className="welcome-logo welcome-logo--svg">
          <img src={dampiLogo} alt="Dampi" className="welcome-logo-img" />
        </div>
        <h1 className="welcome-title brand-font">Dampi</h1>
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
