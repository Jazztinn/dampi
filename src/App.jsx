import { useEffect, useState } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import OnboardingFlow from './screens/Onboarding/OnboardingFlow.jsx';
import DampiChatModal from './components/ai/DampiChatModal.jsx';
import { getSupabaseBrowserClient } from './lib/supabase.js';

async function loadOnboardingAccount(supabase, session) {
  if (!session?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.onboarding_completed) return null;

  const { data: child, error: childError } = await supabase
    .from('children')
    .select('*')
    .eq('primary_guardian_id', session.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (childError) throw childError;
  if (!child) return null;

  return { profile, child };
}

export default function App() {
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [account, setAccount] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    let active = true;
    let authSubscription;
    let supabase;

    const init = async () => {
      try {
        supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;

        const nextAccount = await loadOnboardingAccount(supabase, data.session);
        if (!active) return;

        setAccount(nextAccount);
        setAccountError('');
      } catch (error) {
        if (active) {
          setAccount(null);
          setAccountError(error.message || 'Unable to load your Dampi account.');
        }
      } finally {
        if (active) setLoadingAccount(false);
      }

      if (!active || !supabase) return;

      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          const nextAccount = await loadOnboardingAccount(supabase, session);
          if (!active) return;
          setAccount(nextAccount);
          setAccountError('');
        } catch (error) {
          if (!active) return;
          setAccount(null);
          setAccountError(error.message || 'Unable to load your Dampi account.');
        }
      });

      authSubscription = data.subscription;
    };

    init();

    return () => {
      active = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const handleOnboardingComplete = ({ profile, child }) => {
    setAccount({ profile, child });
    setAccountError('');
  };

  if (loadingAccount) {
    return (
      <div className="dampi-app app-state">
        <p>Loading Dampi...</p>
      </div>
    );
  }

  return (
    <div className="dampi-app">
      {!account ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <>
          <AppNavigator
            profile={account.profile}
            child={account.child}
            onOpenAi={() => setChatOpen(true)}
          />
          <DampiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} tasks={tasks} setTasks={setTasks} />
        </>
      )}
      {accountError && <div className="app-error">{accountError}</div>}
    </div>
  );
}
