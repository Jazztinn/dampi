import { useState, useEffect } from 'react';
import { Baby, Users, Mail, Lock, User, Phone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './accept-invite.css';

// Phases: loading → preview → auth → accepting → success | error
function useInvitePreview(token) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('No invitation token found.'); return; }
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc('get_invite_preview', { p_token: token })
      .then(({ data, error: rpcError }) => {
        if (rpcError || !data?.length) {
          setError('This invitation link is invalid or has already been used.');
          return;
        }
        const row = data[0];
        if (row.expired) {
          setError('This invitation link has expired. Ask the guardian to resend it.');
          return;
        }
        if (row.status !== 'pending') {
          setError(`This invitation has already been ${row.status}.`);
          return;
        }
        setPreview(row);
      });
  }, [token]);

  return { preview, previewError: error };
}

function AuthForm({ lockedEmail, onAuthed, onBack }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ email: lockedEmail, password: '', full_name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    setSubmitError('');
  };

  const validate = () => {
    const e = {};
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (mode === 'signup') {
      if (!form.full_name.trim()) e.full_name = 'Name is required';
      if (!form.phone.trim()) e.phone = 'Phone is required';
    }
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setSubmitError('');
    const supabase = getSupabaseBrowserClient();
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.full_name.trim(), phone: form.phone.trim() },
          },
        });
        if (error) throw error;
      }
      onAuthed();
    } catch (err) {
      setSubmitError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="accept-invite__form-wrapper">
      <TopNavBar variant="inner" title="Sign In to Accept" onBack={onBack} />
      <form className="accept-invite__form" onSubmit={handleSubmit}>
        <div className="accept-invite__mode-toggle">
        <button
          type="button"
          className={`accept-invite__mode-btn ${mode === 'signin' ? 'accept-invite__mode-btn--active' : ''}`}
          onClick={() => setMode('signin')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`accept-invite__mode-btn ${mode === 'signup' ? 'accept-invite__mode-btn--active' : ''}`}
          onClick={() => setMode('signup')}
        >
          Create Account
        </button>
      </div>

      {mode === 'signup' && (
        <div className="accept-invite__field">
          <label>Full Name</label>
          <div className="accept-invite__input-wrap">
            <User size={15} className="accept-invite__input-icon" />
            <input
              type="text"
              placeholder="Your full name"
              value={form.full_name}
              onChange={set('full_name')}
              className={errors.full_name ? 'accept-invite__input accept-invite__input--error' : 'accept-invite__input'}
            />
          </div>
          {errors.full_name && <span className="accept-invite__error">{errors.full_name}</span>}
        </div>
      )}

      <div className="accept-invite__field">
        <label>Email</label>
        <div className="accept-invite__input-wrap">
          <Mail size={15} className="accept-invite__input-icon" />
          <input
            type="email"
            value={form.email}
            readOnly
            className="accept-invite__input accept-invite__input--locked"
          />
        </div>
        <span className="accept-invite__hint">This invite was sent to this address — it cannot be changed.</span>
      </div>

      {mode === 'signup' && (
        <div className="accept-invite__field">
          <label>Phone</label>
          <div className="accept-invite__input-wrap">
            <Phone size={15} className="accept-invite__input-icon" />
            <input
              type="tel"
              placeholder="+63 912 345 6789"
              value={form.phone}
              onChange={set('phone')}
              className={errors.phone ? 'accept-invite__input accept-invite__input--error' : 'accept-invite__input'}
            />
          </div>
          {errors.phone && <span className="accept-invite__error">{errors.phone}</span>}
        </div>
      )}

      <div className="accept-invite__field">
        <label>Password</label>
        <div className="accept-invite__input-wrap">
          <Lock size={15} className="accept-invite__input-icon" />
          <input
            type="password"
            placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
            value={form.password}
            onChange={set('password')}
            className={errors.password ? 'accept-invite__input accept-invite__input--error' : 'accept-invite__input'}
          />
        </div>
        {errors.password && <span className="accept-invite__error">{errors.password}</span>}
      </div>

      {submitError && <p className="accept-invite__submit-error">{submitError}</p>}

      <button type="submit" className="accept-invite__cta" disabled={submitting}>
        {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In & Accept' : 'Create Account & Accept'}
      </button>
    </form>
    </div>
  );
}

export default function AcceptInviteScreen({ token, hasSession, onAccepted, onDismiss }) {
  const { preview, previewError } = useInvitePreview(token);
  const [phase, setPhase] = useState('loading'); // loading | preview | auth | accepting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [childName, setChildName] = useState('');

  // Transition from loading once preview resolves
  useEffect(() => {
    if (previewError) { setErrorMsg(previewError); setPhase('error'); return; }
    if (preview) setPhase('preview');
  }, [preview, previewError]);

  const handleAccept = async () => {
    setPhase('accepting');
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setPhase('auth'); return; }

    try {
      const { data, error } = await supabase.functions.invoke('accept-caregiver-invite', {
        body: { token },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setChildName(preview?.child_name ?? '');
      setPhase('success');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setPhase('error');
    }
  };

  const handleAuthed = () => {
    // Auth state change in App.jsx will update hasSession; proceed to accept
    handleAccept();
  };

  return (
    <div className="accept-invite">
      <div className="accept-invite__card">
        {/* Header */}
        <div className="accept-invite__header">
          <div className="accept-invite__logo">
            <Users size={22} strokeWidth={1.8} />
          </div>
          <p className="accept-invite__app-name">Dampi</p>
        </div>

        {/* Loading */}
        {phase === 'loading' && (
          <div className="accept-invite__state">
            <Loader size={28} className="accept-invite__spinner" />
            <p className="accept-invite__state-label">Loading invitation…</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="accept-invite__state accept-invite__state--error">
            <AlertCircle size={32} strokeWidth={1.5} />
            <p className="accept-invite__state-title">Invitation unavailable</p>
            <p className="accept-invite__state-desc">{errorMsg}</p>
            <button className="accept-invite__cta accept-invite__cta--ghost" onClick={onDismiss}>
              Go to Dampi
            </button>
          </div>
        )}

        {/* Preview */}
        {phase === 'preview' && preview && (
          <div className="accept-invite__preview">
            <div className="accept-invite__preview-avatar">
              <Baby size={24} strokeWidth={1.5} />
            </div>
            <p className="accept-invite__preview-title">You've been invited!</p>
            <p className="accept-invite__preview-desc">
              <strong>{preview.guardian_name}</strong> invited you to be a caregiver
              {preview.child_name ? (
                <> for <strong>{preview.child_name}</strong></>
              ) : ' on their family account'} on Dampi.
            </p>
            <p className="accept-invite__preview-email">Invite sent to: {preview.invitee_email}</p>

            {hasSession ? (
              <button className="accept-invite__cta" onClick={handleAccept}>
                Accept Invitation
              </button>
            ) : (
              <button className="accept-invite__cta" onClick={() => setPhase('auth')}>
                Sign in to Accept
              </button>
            )}

            <button className="accept-invite__back-link" onClick={onDismiss}>
              Dismiss
            </button>
          </div>
        )}

        {/* Auth */}
        {phase === 'auth' && preview && (
          <div className="accept-invite__auth">
            <p className="accept-invite__auth-title">Sign in or create an account</p>
            <p className="accept-invite__auth-subtitle">to accept the invitation from {preview.guardian_name}</p>
            <AuthForm
              lockedEmail={preview.invitee_email}
              onAuthed={handleAuthed}
              onBack={() => setPhase('preview')}
            />
          </div>
        )}

        {/* Accepting */}
        {phase === 'accepting' && (
          <div className="accept-invite__state">
            <Loader size={28} className="accept-invite__spinner" />
            <p className="accept-invite__state-label">Accepting invitation…</p>
          </div>
        )}

        {/* Success */}
        {phase === 'success' && (
          <div className="accept-invite__state accept-invite__state--success">
            <CheckCircle size={40} strokeWidth={1.5} />
            <p className="accept-invite__state-title">You're now a caregiver!</p>
            <p className="accept-invite__state-desc">
              {childName
                ? `You can now help care for ${childName} on Dampi.`
                : "You now have caregiver access on this family's Dampi account."}
            </p>
            <button className="accept-invite__cta" onClick={onAccepted}>
              Open Dampi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
