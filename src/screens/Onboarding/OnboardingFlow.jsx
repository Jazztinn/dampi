import { useState } from 'react';
import WelcomeScreen from './WelcomeScreen.jsx';
import CreateAccountScreen from './CreateAccountScreen.jsx';
import AddChildScreen from './AddChildScreen.jsx';
import InviteFamilyScreen from './InviteFamilyScreen.jsx';
import './onboarding.css';

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    childName: '',
    childDOB: '',
    childGender: '',
    familyEmail: '',
  });

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

  const handleComplete = (newData = {}) => {
    const finalData = { ...formData, ...newData };
    localStorage.setItem('dampiOnboardingComplete', 'true');
    localStorage.setItem('dampiUserData', JSON.stringify(finalData));
    onComplete && onComplete(finalData);
  };

  const screens = [
    <WelcomeScreen key="welcome" onNext={handleNext} />,
    <CreateAccountScreen key="account" data={formData} onNext={handleNext} />,
    <AddChildScreen key="child" data={formData} onNext={handleNext} />,
    <InviteFamilyScreen key="family" data={formData} onNext={handleNext} onComplete={handleComplete} />,
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
