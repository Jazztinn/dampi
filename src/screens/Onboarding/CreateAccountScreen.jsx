import { Mail, Lock, ChevronRight, Phone, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import SocialAuthButtons from '../Auth/SocialAuthButtons.jsx';

export default function CreateAccountScreen({
  data,
  onNext,
  isSubmitting = false,
  submitError = '',
  authenticatedEmail = '',
}) {
  const [formData, setFormData] = useState({
    fullName: data.fullName || '',
    phone: data.phone || '',
    email: data.email || '',
    password: data.password || '',
  });
  const [errors, setErrors] = useState({});
  const hasAuthenticatedAccount = !!authenticatedEmail;

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      fullName: current.fullName || data.fullName || '',
      phone: current.phone || data.phone || '',
      email: current.email || data.email || authenticatedEmail || '',
      password: hasAuthenticatedAccount ? '' : current.password || data.password || '',
    }));
  }, [authenticatedEmail, data.email, data.fullName, data.password, data.phone, hasAuthenticatedAccount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';

    if (!hasAuthenticatedAccount) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'At least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({
      ...formData,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });
  };

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2 className="brand-font">Create Account</h2>
        <p>Set up your Dampi account</p>
      </div>

      {!hasAuthenticatedAccount && (
        <>
          <SocialAuthButtons action="Sign up" />

          <div className="login-divider">
            <span className="login-divider__line" />
            <span className="login-divider__text">or</span>
            <span className="login-divider__line" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label htmlFor="fullName">Parent or Guardian Name</label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Parent or guardian name"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
            />
          </div>
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <div className="input-wrapper">
            <Phone size={18} className="input-icon" />
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+63 mobile number"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
            />
          </div>
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={hasAuthenticatedAccount}
            />
          </div>
          {errors.email && <span className="error-text">{errors.email}</span>}
          {hasAuthenticatedAccount && (
            <span className="form-hint">Connected with Google or Facebook.</span>
          )}
        </div>

        {!hasAuthenticatedAccount && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        )}

        {submitError && <span className="error-text">{submitError}</span>}

        <button type="submit" className="onboarding-cta" disabled={isSubmitting}>
          {isSubmitting ? 'Checking...' : 'Continue'}
          <ChevronRight size={18} />
        </button>
      </form>

      <p className="form-note">We'll keep your data safe and private.</p>
    </div>
  );
}
