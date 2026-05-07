import { Users, Mail, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function InviteFamilyScreen({ data, onComplete, isSubmitting = false, submitError = '' }) {
  const [formData, setFormData] = useState({
    familyEmail: data.familyEmail || '',
    discoverable: data.discoverable !== false,
  });
  const [errors, setErrors] = useState({});
  const [invited, setInvited] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formData.familyEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.familyEmail)) {
        newErrors.familyEmail = 'Invalid email';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const completed = await onComplete(formData);
    if (completed && formData.familyEmail) {
      setInvited(true);
    }
  };

  const handleSkip = async () => {
    await onComplete(formData);
  };

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2 className="brand-font">Invite Family Members</h2>
        <p>Optional: Let caregivers help track health</p>
      </div>

      {!invited ? (
        <form onSubmit={handleInvite} className="onboarding-form">
          <div className="family-info">
            <Users size={40} className="info-icon" />
            <p>Invite a caregiver, grandparent, or family member to help monitor your child's health.</p>
          </div>

          <div className="form-group">
            <label htmlFor="familyEmail">Email Address (optional)</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="familyEmail"
                type="email"
                name="familyEmail"
                placeholder="Caregiver email address"
                value={formData.familyEmail}
                onChange={handleChange}
                className={errors.familyEmail ? 'error' : ''}
                disabled={isSubmitting}
              />
            </div>
            {errors.familyEmail && <span className="error-text">{errors.familyEmail}</span>}
            {submitError && <span className="error-text">{submitError}</span>}
          </div>

          <label className="onboarding-toggle-row" htmlFor="discoverable">
            <input
              id="discoverable"
              type="checkbox"
              name="discoverable"
              checked={formData.discoverable}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>
              <strong>Show me in caregiver search</strong>
              <small>Other Dampi users can find your name and send care-circle requests. Your email and phone stay private.</small>
            </span>
          </label>

          <div className="onboarding-button-group">
            <button type="submit" className="onboarding-cta" disabled={isSubmitting}>
              {isSubmitting ? 'Finishing Setup...' : formData.familyEmail ? 'Save Invite' : 'Finish Setup'}
              <ChevronRight size={18} />
            </button>
            <button type="button" onClick={handleSkip} className="onboarding-secondary" disabled={isSubmitting}>
              Skip for Now
            </button>
          </div>
        </form>
      ) : (
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h3>Invite Saved</h3>
          <p>We'll keep this caregiver invitation pending until invite sending is ready.</p>
          {submitError && <span className="error-text">{submitError}</span>}
        </div>
      )}
    </div>
  );
}
