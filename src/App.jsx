import { useEffect, useState } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import OnboardingFlow from './screens/Onboarding/OnboardingFlow.jsx';
import AuthLandingScreen from './screens/Auth/AuthLandingScreen.jsx';
import LoginScreen from './screens/Auth/LoginScreen.jsx';
import DampiChatModal from './components/ai/DampiChatModal.jsx';
import AcceptInviteScreen from './screens/AcceptInvite/AcceptInviteScreen.jsx';
import { getSupabaseBrowserClient } from './lib/supabase.js';
import dampiLogo from './assets/dampi.svg';

const ONBOARDING_STORAGE_KEYS = [
  'dampi.onboardingStep',
  'dampi.onboardingData',
  'dampi.pendingOnboarding',
];

function clearOnboardingStorage() {
  ONBOARDING_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

async function loadOnboardingAccount(supabase, session) {
  if (!session?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.onboarding_completed) return null;

  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('*')
    .eq('primary_guardian_id', session.user.id)
    .order('created_at', { ascending: true });

  if (childrenError) throw childrenError;
  if (!children?.length) return null;

  const { data: hmoCoverage, error: hmoError } = await supabase
    .from('hmo_coverage')
    .select('*')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (hmoError) throw hmoError;

  return { profile, child: children[0], children, hmoCoverage };
}

export default function App() {
  const [splashTimerDone, setSplashTimerDone] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [account, setAccount] = useState(null);
  const [hasSession, setHasSession] = useState(false);
  const [authView, setAuthView] = useState('landing');
  const [accountError, setAccountError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState({});
  const [symptomLogRequest, setSymptomLogRequest] = useState(null);
  const [pendingInviteToken, setPendingInviteToken] = useState(() => {
    const urlToken = new URLSearchParams(window.location.search).get('invite');
    return urlToken || localStorage.getItem('dampi.pendingInviteToken') || null;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimerDone(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
            setAccountError('');
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

  // Persist invite token to localStorage so it survives email-confirmation redirects
  useEffect(() => {
    if (pendingInviteToken) {
      localStorage.setItem('dampi.pendingInviteToken', pendingInviteToken);
    } else {
      localStorage.removeItem('dampi.pendingInviteToken');
    }
  }, [pendingInviteToken]);

  const clearInviteToken = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setPendingInviteToken(null);
  };

  const handleOnboardingComplete = ({ profile, child, hmoCoverage }) => {
    setAccount({ profile, child, children: child ? [child] : [], hmoCoverage });
    setAccountError('');
  };

  const handleProfileChange = (profile) => {
    setAccount((current) => {
      if (!current) return current;

      return { ...current, profile: { ...current.profile, ...profile } };
    });
  };

  const handleHmoCoverageChange = (hmoCoverage) => {
    setAccount((current) => {
      if (!current) return current;

      return { ...current, hmoCoverage };
    });
  };

  const handleChildrenChange = (updater) => {
    setAccount((current) => {
      if (!current) return current;

      const nextChildren = typeof updater === 'function'
        ? updater(current.children || [])
        : updater;
      const children = Array.isArray(nextChildren) ? nextChildren : [];

      return {
        ...current,
        child: children[0] || null,
        children,
      };
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setAccountError('');
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      setAccountError(error.message || 'Unable to sign out remotely. Local session was cleared.');
    } finally {
      clearOnboardingStorage();
      setAccount(null);
      setHasSession(false);
      setAuthView('landing');
      setChatOpen(false);
      setTasks({});
      setSigningOut(false);
    }
  };

  if (loadingAccount || !splashTimerDone) {
    return (
      <div className="dampi-app app-state splash-screen">
        <img src={dampiLogo} alt="Dampi" className="splash-logo" />
      </div>
    );
  }

  if (pendingInviteToken && !loadingAccount) {
    return (
      <div className="dampi-app">
        <AcceptInviteScreen
          token={pendingInviteToken}
          hasSession={hasSession}
          onAccepted={clearInviteToken}
          onDismiss={clearInviteToken}
        />
      </div>
    );
  }

  if (account) {
    return (
      <div className="dampi-app">
        <AppNavigator
          profile={account.profile}
          child={account.child}
          children={account.children}
          hmoCoverage={account.hmoCoverage}
          onOpenAi={() => setChatOpen(true)}
          onSignOut={handleSignOut}
          onProfileChange={handleProfileChange}
          onHmoCoverageChange={handleHmoCoverageChange}
          onChildrenChange={handleChildrenChange}
          signingOut={signingOut}
          symptomLogRequest={symptomLogRequest}
        />
        <DampiChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          tasks={tasks}
          setTasks={setTasks}
          profile={account.profile}
          child={account.child}
          children={account.children}
          onOpenSymptomLogDraft={(payload = {}) => setSymptomLogRequest({ id: Date.now(), ...payload })}
        />
        {accountError && <div className="app-error">{accountError}</div>}
      </div>
    );
  }

  const showOnboarding = hasSession || authView === 'onboarding';

  return (
    <div className="dampi-app">
      {!showOnboarding && authView === 'login' && (
        <LoginScreen onBack={() => setAuthView('landing')} />
      )}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onInitialBack={!hasSession ? () => setAuthView('landing') : null}
        />
      )}
      {!showOnboarding && authView === 'landing' && (
        <AuthLandingScreen
          onNew={() => setAuthView('onboarding')}
          onExisting={() => setAuthView('login')}
        />
      )}
      {accountError && <div className="app-error">{accountError}</div>}
    </div>
  );
}
