import { useEffect, useState } from 'react';
import WelcomeScreen from './WelcomeScreen.jsx';
import CreateAccountScreen from './CreateAccountScreen.jsx';
import AddChildScreen from './AddChildScreen.jsx';
import InviteFamilyScreen from './InviteFamilyScreen.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import { ChevronLeft } from 'lucide-react';
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
  const [step, setStep] = useState(() => {
    const saved = window.localStorage.getItem('dampi.onboardingStep');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [formData, setFormData] = useState(() => {
    const saved = window.localStorage.getItem('dampi.onboardingData');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      childName: '',
      childDOB: '',
      childGender: '',
      familyEmail: '',
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Persist state changes
  useEffect(() => {
    window.localStorage.setItem('dampi.onboardingStep', step.toString());
  }, [step]);

  useEffect(() => {
    const { password: _pw, ...safeData } = formData;
    window.localStorage.setItem('dampi.onboardingData', JSON.stringify(safeData));
  }, [formData]);

  const clearPersistence = () => {
    window.localStorage.removeItem('dampi.onboardingStep');
    window.localStorage.removeItem('dampi.onboardingData');
    clearPendingOnboarding();
  };

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

    clearPersistence();
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

  const handleNext = async (newData = {}) => {
    const nextData = { ...formData, ...newData };
    setFormData(nextData);

    if (step === 1) {
      setIsSubmitting(true);
      setSubmitError('');

      try {
        const supabase = getSupabaseBrowserClient();
        const email = nextData.email.trim();

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        let user = sessionData.session?.user || null;

        if (user?.email && user.email.toLowerCase() !== email.toLowerCase()) {
          await supabase.auth.signOut();
          user = null;
        }

        if (!user) {
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: nextData.password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

          if (signUpError) throw signUpError;

          if (!authData.session) {
            const pendingData = setPendingOnboarding({
              ...nextData,
              userId: authData.user?.id,
            });
            setPendingConfirmation(pendingData);
            return;
          }
        }
      } catch (error) {
        setSubmitError(error.message || 'Unable to create your account.');
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

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

      const user = sessionData.session?.user || null;

      if (user?.email && user.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error(`A different account is already signed in as ${user.email}.`);
      }

      if (!user) throw new Error('No active account session found. Create your account first.');
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
    <CreateAccountScreen
      key="account"
      data={formData}
      onNext={handleNext}
      isSubmitting={isSubmitting}
      submitError={step === 1 ? submitError : ''}
    />,
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
                  clearPersistence();
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
