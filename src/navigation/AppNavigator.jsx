import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BottomNav from '../components/BottomNav.jsx';
import HomeScreen from '../screens/Home/HomeScreen.jsx';
import FamilyScreen from '../screens/Family/FamilyScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';
import SymptomLogScreen from '../screens/SymptomLog/SymptomLogScreen.jsx';
import ChildRegistrationFlow from '../screens/ChildRegistration/ChildRegistrationFlow.jsx';
import './app-navigator.css';

const SCREENS = {
  home: HomeScreen,
  symptoms: SymptomLogScreen,
  hmo: HMOPortalScreen,
  family: FamilyScreen,
  profile: FinancialAssistanceScreen,
};

// Screens that take over the full app shell (no global bottom nav).
const FULLSCREEN_FLOW = new Set();

export default function AppNavigator({
  profile,
  child,
  children = [],
  hmoCoverage,
  onOpenAi,
  onSignOut,
  onProfileChange,
  onHmoCoverageChange,
  onChildrenChange,
  signingOut = false,
  symptomLogRequest = null,
}) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState([]);
  const [showSymptomLog, setShowSymptomLog] = useState(false);
  const [symptomLogChildId, setSymptomLogChildId] = useState(null);
  const [showChildRegistration, setShowChildRegistration] = useState(false);
  const [registrationChildId, setRegistrationChildId] = useState(null);
  const contentAreaRef = useRef(null);

  useLayoutEffect(() => {
    if (showSymptomLog) return;

    const container = contentAreaRef.current;
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentScreen, showSymptomLog]);

  useEffect(() => {
    if (symptomLogRequest) {
      setSymptomLogChildId(symptomLogRequest.childId || null);
      setShowSymptomLog(true);
    }
  }, [symptomLogRequest]);

  const navigateTo = (screen) => {
    if (screen === 'symptoms') {
      setSymptomLogChildId(null);
      setShowSymptomLog(true);
      return;
    }

    setShowSymptomLog(false);
    if (currentScreen === screen) return;

    setScreenHistory((history) => [...history, currentScreen].slice(-12));
    setCurrentScreen(screen);
  };

  const goBack = () => {
    setScreenHistory((history) => {
      const nextHistory = [...history];
      const previous = nextHistory.pop() || 'home';
      setCurrentScreen(previous);
      return nextHistory;
    });
  };

  const openSymptomLog = () => {
    setSymptomLogChildId(null);
    setShowSymptomLog(true);
  };

  const openChildRegistration = (childId) => {
    setRegistrationChildId(childId);
    setShowChildRegistration(true);
  };

  const handleRegistrationComplete = (data = {}) => {
    setShowChildRegistration(false);
    if (data.child) {
      onChildrenChange?.((prev) => 
        prev.map(c => c.id === data.child.id ? data.child : c)
      );
    }
    if (data.profile) {
      onProfileChange?.(data.profile);
    }
  };

  const Screen = SCREENS[currentScreen] || HomeScreen;
  const isFullscreen = FULLSCREEN_FLOW.has(currentScreen);
  const symptomLogChild = children.find((item) => item.id === symptomLogChildId) || child;

  return (
    <div className={`app-container${isFullscreen ? ' app-container--fullscreen' : ''}`}>
      <div className="content-area" ref={contentAreaRef}>
        {showSymptomLog ? (
          <SymptomLogScreen
            profile={profile}
            child={symptomLogChild}
            children={children}
            onExit={() => setShowSymptomLog(false)}
          />
        ) : showChildRegistration ? (
          <ChildRegistrationFlow
            childId={registrationChildId}
            onExit={() => setShowChildRegistration(false)}
            onComplete={handleRegistrationComplete}
          />
        ) : (
          <Screen
            profile={profile}
            child={child}
            children={children}
            hmoCoverage={hmoCoverage}
            onOpenAi={onOpenAi}
            onSignOut={onSignOut}
            onProfileChange={onProfileChange}
            onHmoCoverageChange={onHmoCoverageChange}
            onChildrenChange={onChildrenChange}
            signingOut={signingOut}
            onNavigateToSymptoms={openSymptomLog}
            onNavigateToChildRegistration={openChildRegistration}
            onExit={() => navigateTo('home')}
            onBack={goBack}
          />
        )}
      </div>
      {!isFullscreen && !showChildRegistration && (
        <BottomNav
          active={showSymptomLog ? 'symptoms' : currentScreen}
          setActive={navigateTo}
          openChatModal={onOpenAi}
        />
      )}
    </div>
  );
}
