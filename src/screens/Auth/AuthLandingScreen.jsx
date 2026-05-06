import { Heart } from 'lucide-react';
import './auth.css';

export default function AuthLandingScreen({ onNew, onExisting }) {
  return (
    <div className="auth-landing">
      <div className="auth-landing__content">
        <div className="auth-landing__header">
          <div className="auth-landing__logo">
            <Heart size={52} strokeWidth={1.5} />
          </div>
          <h1 className="auth-landing__title">Dampi</h1>
          <p className="auth-landing__subtitle">Family Health Journal</p>
          <p className="auth-landing__tagline">
            Track your child's health, coordinate with caregivers,<br />
            and stay on top of medical visits — all in one place.
          </p>
        </div>

        <div className="auth-landing__actions">
          <button className="onboarding-cta" onClick={onNew}>
            I'm New
          </button>
          <button className="onboarding-secondary" onClick={onExisting}>
            I Already Have an Account
          </button>
        </div>
      </div>
    </div>
  );
}
