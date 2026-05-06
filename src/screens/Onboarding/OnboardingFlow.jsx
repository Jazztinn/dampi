import { useEffect, useState } from 'react';
import WelcomeScreen from './WelcomeScreen.jsx';
import CreateAccountScreen from './CreateAccountScreen.jsx';
import AddChildScreen from './AddChildScreen.jsx';
import InviteFamilyScreen from './InviteFamilyScreen.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './onboarding.css';

const PENDING_ONBOARDING_KEY = 'dampi.pendingOnboarding';

function getPendingOnboarding() {
  try {
    const pending = window.localStorage.getItem(PENDING_ONBOARDING_KEY);
    return pending ? JSON.parse(pending) : null;
  } catch {
    return null;
  }
}

function setPendingOnboarding(data) {
  const { password: _password, ...safeData } = data;
  window.localStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(safeData));
  return safeData;
}

function clearPendingOnboarding() {
  window.localStorage.removeItem(PENDING_ONBOARDING_KEY);
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    childName: '',
    childDOB: '',
    childGender: '',
    familyEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const persistOnboardingAccount = async (supabase, user, data) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    const { data: existingChild, error: existingChildError } = await supabase
      .from('children')
      .select('*')
      .eq('primary_guardian_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingChildError) throw existingChildError;

    const childPayload = {
      primary_guardian_id: user.id,
      full_name: data.childName.trim(),
      date_of_birth: data.childDOB,
      gender: data.childGender,
    };

    const childWrite = existingChild
      ? supabase
          .from('children')
          .update(childPayload)
          .eq('id', existingChild.id)
          .select()
          .single()
      : supabase
          .from('children')
          .insert(childPayload)
          .select()
          .single();

    const { data: child, error: childError } = await childWrite;

    if (childError) throw childError;

    const familyEmail = data.familyEmail.trim();
    if (familyEmail) {
      const { error: inviteError } = await supabase
        .from('caregiver_invites')
        .insert({
          inviter_profile_id: user.id,
          child_id: child.id,
          invitee_email: familyEmail,
        });

      if (inviteError && inviteError.code !== '23505') throw inviteError;
    }

    const { data: profile, error: updateProfileError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
      .select()
      .single();

    if (updateProfileError) throw updateProfileError;

    clearPendingOnboarding();
    setPendingConfirmation(null);
    onComplete && onComplete({ profile, child });
    return true;
  };

  const resumeConfirmedOnboarding = async (pendingData = pendingConfirmation) => {
    if (!pendingData) return false;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;
      if (!user) {
        setSubmitError('Confirm your email from the Supabase message, then return here to continue.');
        return false;
      }

      if (pendingData.userId && pendingData.userId !== user.id) {
        throw new Error('A different account is signed in. Sign out and open the confirmation link for this email.');
      }

      return await persistOnboardingAccount(supabase, user, pendingData);
    } catch (error) {
      setSubmitError(error.message || 'Unable to finish onboarding.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const pending = getPendingOnboarding();
    if (!pending) return;

    setPendingConfirmation(pending);
    setFormData((current) => ({ ...current, ...pending }));
    resumeConfirmedOnboarding(pending);
  }, []);

  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'account', label: 'Create Account' },
    { id: 'child', label: 'Add Child' },
    { id: 'family', label: 'Invite Family' },
  ];

  const handleNext = (newData = {}) => {
    setFormData({ ...formData, ...newData });
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async (newData = {}) => {
    const finalData = { ...formData, ...newData };
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const email = finalData.email.trim();
      const familyEmail = finalData.familyEmail.trim();

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      let user = sessionData.session?.user || null;

      if (user?.email && user.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error(`A different account is already signed in as ${user.email}.`);
      }

      if (!user) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: finalData.password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;
        if (!authData.session) {
          const pendingData = setPendingOnboarding({
            ...finalData,
            userId: authData.user?.id,
          });
          setPendingConfirmation(pendingData);
          return false;
        }
        user = authData.user;
      }

      if (!user) throw new Error('Supabase did not return a user for this signup.');
      return await persistOnboardingAccount(supabase, user, { ...finalData, familyEmail });
    } catch (error) {
      setSubmitError(error.message || 'Unable to finish onboarding.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const screens = [
    <WelcomeScreen key="welcome" onNext={handleNext} />,
    <CreateAccountScreen key="account" data={formData} onNext={handleNext} />,
    <AddChildScreen key="child" data={formData} onNext={handleNext} />,
    <InviteFamilyScreen
      key="family"
      data={formData}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />,
  ];

  if (pendingConfirmation) {
    return (
      <div className="onboarding-flow">
        <div className="onboarding-screen">
          <div className="onboarding-screen-content">
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h3>Confirm your email</h3>
              <p>
                We sent a confirmation link to {pendingConfirmation.email}. Open it in this browser,
                then continue setup here.
              </p>
              {submitError && <span className="error-text">{submitError}</span>}
              <button className="onboarding-cta" onClick={() => resumeConfirmedOnboarding()} disabled={isSubmitting}>
                {isSubmitting ? 'Checking...' : 'I confirmed my email'}
              </button>
              <button
                className="onboarding-secondary"
                onClick={() => {
                  clearPendingOnboarding();
                  setPendingConfirmation(null);
                  setSubmitError('');
                }}
                disabled={isSubmitting}
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-flow">
      {/* Progress indicator */}
      <div className="onboarding-progress">
        {steps.map((s, i) => (
          <div key={s.id} className={`onboarding-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      {/* Screen */}
      <div className="onboarding-screen">{screens[step]}</div>

      {/* Navigation */}
      {step > 0 && (
        <button className="onboarding-back" onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
