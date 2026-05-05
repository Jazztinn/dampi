import { useState, useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import OnboardingFlow from './screens/Onboarding/OnboardingFlow.jsx';
import DampiChatModal from './components/ai/DampiChatModal.jsx';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('dampiOnboardingComplete') === 'true';
    setOnboardingComplete(completed);
  }, []);

  const handleOnboardingComplete = (userData) => {
    setOnboardingComplete(true);
  };

  return (
    <div className="dampi-app">
      {!onboardingComplete ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <>
          <AppNavigator onOpenAi={() => setChatOpen(true)} />
          <DampiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} tasks={tasks} setTasks={setTasks} />
        </>
      )}
    </div>
  );
}
