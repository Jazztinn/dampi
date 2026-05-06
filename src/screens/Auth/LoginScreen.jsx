import { useState } from 'react';
import { Mail, Lock, Phone, MessageSquare } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './auth.css';

export default function LoginScreen({ onBack }) {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'verify'

  // Email + password fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone OTP fields
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const clearMessages = () => {
    setError('');
    setInfo('');
  };

  const switchMode = (next) => {
    setMode(next);
    setOtpStep('phone');
    clearMessages();
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    clearMessages();
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      // onAuthStateChange in App.jsx handles the rest
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    clearMessages();
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (authError) throw authError;
      setOtpStep('verify');
      setInfo(`A verification code was sent to ${phone.trim()}.`);
    } catch (err) {
      setError(err.message || 'Could not send OTP. Check the phone number and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    clearMessages();
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otpCode.trim(),
        type: 'sms',
      });
      if (authError) throw authError;
      // onAuthStateChange in App.jsx handles the rest
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <TopNavBar variant="inner" title="Sign In" onBack={onBack} />

      <div className="login-screen__content">
        <div className="login-screen__header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Dampi</p>
        </div>

        {/* Mode tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => switchMode('password')}
            type="button"
          >
            Email & Password
          </button>
          <button
            className={`login-tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => switchMode('otp')}
            type="button"
          >
            Phone OTP
          </button>
        </div>

        {/* Email + Password */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="onboarding-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && <span className="error-text">{error}</span>}

            <button type="submit" className="onboarding-cta" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Phone OTP */}
        {mode === 'otp' && (
          <>
            {otpStep === 'phone' ? (
              <form onSubmit={handleSendOtp} className="onboarding-form">
                <div className="form-group">
                  <label htmlFor="login-phone">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      id="login-phone"
                      type="tel"
                      placeholder="+63 917 204 1138"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {error && <span className="error-text">{error}</span>}

                <button type="submit" className="onboarding-cta" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="onboarding-form">
                {info && (
                  <div className="otp-step">
                    <MessageSquare size={16} />
                    <span>{info}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="login-otp">Verification Code</label>
                  <div className="input-wrapper">
                    <MessageSquare size={18} className="input-icon" />
                    <input
                      id="login-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {error && <span className="error-text">{error}</span>}

                <button type="submit" className="onboarding-cta" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  className="onboarding-secondary"
                  onClick={() => {
                    setOtpStep('phone');
                    setOtpCode('');
                    clearMessages();
                  }}
                  disabled={isSubmitting}
                >
                  Change Number
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
