import { Users, Mail, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function InviteFamilyScreen({ data, onNext, onComplete }) {
  const [formData, setFormData] = useState({
    familyEmail: data.familyEmail || '',
  });
  const [errors, setErrors] = useState({});
  const [invited, setInvited] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleInvite = (e) => {
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

    if (formData.familyEmail) {
      setInvited(true);
      setTimeout(() => {
        onComplete(formData);
      }, 1500);
    }
  };

  const handleSkip = () => {
    onComplete(formData);
  };

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2>Invite Family Members</h2>
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
                placeholder="grandma@example.com"
                value={formData.familyEmail}
                onChange={handleChange}
                className={errors.familyEmail ? 'error' : ''}
              />
            </div>
            {errors.familyEmail && <span className="error-text">{errors.familyEmail}</span>}
          </div>

          <div className="onboarding-button-group">
            <button type="submit" className="onboarding-cta">
              Send Invite
              <ChevronRight size={18} />
            </button>
            <button type="button" onClick={handleSkip} className="onboarding-secondary">
              Skip for Now
            </button>
          </div>
        </form>
      ) : (
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h3>Invitation Sent!</h3>
          <p>They'll receive an invite to join Dampi and help track your child's health.</p>
        </div>
      )}
    </div>
  );
}
