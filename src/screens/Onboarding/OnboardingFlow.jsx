import { useState } from 'react';
import WelcomeScreen from './WelcomeScreen.jsx';
import CreateAccountScreen from './CreateAccountScreen.jsx';
import AddChildScreen from './AddChildScreen.jsx';
import InviteFamilyScreen from './InviteFamilyScreen.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './onboarding.css';

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
        });

        if (signUpError) throw signUpError;
        user = authData.user;
      }

      if (!user) throw new Error('Supabase did not return a user for this signup.');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: finalData.fullName.trim(),
          phone: finalData.phone.trim(),
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
        full_name: finalData.childName.trim(),
        date_of_birth: finalData.childDOB,
        gender: finalData.childGender,
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

      onComplete && onComplete({ profile, child });
      return true;
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
        <button className="onboarding-back" onClick={handleBack}>
          ← Back
        </button>
      )}
    </div>
  );
}
