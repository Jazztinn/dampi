import dampiLogo from '../../assets/dampi.svg';
import './auth.css';

export default function AuthLandingScreen({ onNew, onExisting }) {
  return (
    <div className="auth-landing">
      <div className="auth-landing__content">
        <div className="auth-landing__header">
          <div className="auth-landing__logo auth-landing__logo--svg">
            <img src={dampiLogo} alt="Dampi" className="auth-landing__logo-img" />
          </div>
          <h1 className="auth-landing__title brand-font">Dampi</h1>
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
