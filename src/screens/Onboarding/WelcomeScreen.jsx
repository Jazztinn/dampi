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
          <p>Invite family and caregivers to help track health</p>
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

<p className="welcome-legal" style={{ color: '#6b7280', fontSize: '14px' }}>
  By continuing, you agree to our{" "}
  <a 
    href="https://docs.google.com/document/d/1aR-ZZ1d5Tvc24P88FT3IoZ-30XIbBR4lEEM3rwhqVo0/edit?tab=t.0" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ 
      color: '#00a4ea', 
      textDecoration: 'underline', 
      textUnderlineOffset: '3px',
      marginLeft: '4px' 
    }}
  >
    Terms of Service and Privacy Policy
  </a>
</p>
    </div>
  );
}
