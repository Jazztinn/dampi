import { useEffect, useState } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import OnboardingFlow from './screens/Onboarding/OnboardingFlow.jsx';
import AuthLandingScreen from './screens/Auth/AuthLandingScreen.jsx';
import LoginScreen from './screens/Auth/LoginScreen.jsx';
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
  const [hasSession, setHasSession] = useState(false);
  // authView only matters when !hasSession: 'landing' | 'onboarding' | 'login'
  const [authView, setAuthView] = useState('landing');
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

        const session = data.session;
        setHasSession(!!session);

        const nextAccount = await loadOnboardingAccount(supabase, session);
        if (!active) return;

        setAccount(nextAccount);
        setAccountError('');
      } catch (error) {
        if (active) {
          setAccount(null);
          setHasSession(false);
          setAccountError(error.message || 'Unable to load your Dampi account.');
        }
      } finally {
        if (active) setLoadingAccount(false);
      }

      if (!active || !supabase) return;

      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        try {
          setHasSession(!!session);
          if (!session) {
            setAccount(null);
            setAuthView('landing');
            return;
          }
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

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      // onAuthStateChange will reset state and set authView to 'landing'
    } catch {
      setAccount(null);
      setHasSession(false);
      setAuthView('landing');
    }
  };

  if (loadingAccount) {
    return (
      <div className="dampi-app app-state">
        <p>Loading Dampi...</p>
      </div>
    );
  }

  // Fully authenticated and onboarding complete → Dashboard
  if (account) {
    return (
      <div className="dampi-app">
        <AppNavigator
          profile={account.profile}
          child={account.child}
          onOpenAi={() => setChatOpen(true)}
          onSignOut={handleSignOut}
        />
        <DampiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} tasks={tasks} setTasks={setTasks} />
        {accountError && <div className="app-error">{accountError}</div>}
      </div>
    );
  }

  // Session exists but onboarding not complete → continue onboarding
  if (hasSession) {
    return (
      <div className="dampi-app">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
        {accountError && <div className="app-error">{accountError}</div>}
      </div>
    );
  }

  // No session — show auth flow
  return (
    <div className="dampi-app">
      {authView === 'login' && (
        <LoginScreen onBack={() => setAuthView('landing')} />
      )}
      {authView === 'onboarding' && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      {authView === 'landing' && (
        <AuthLandingScreen
          onNew={() => setAuthView('onboarding')}
          onExisting={() => setAuthView('login')}
        />
      )}
      {accountError && <div className="app-error">{accountError}</div>}
    </div>
  );
}
