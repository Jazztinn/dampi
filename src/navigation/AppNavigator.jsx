import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BottomNav from '../components/BottomNav.jsx';
import HomeScreen from '../screens/Home/HomeScreen.jsx';
import FamilyScreen from '../screens/Family/FamilyScreen.jsx';
import DocumentsScreen from '../screens/Documents/DocumentsScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';
import SymptomLogScreen from '../screens/SymptomLog/SymptomLogScreen.jsx';
import './app-navigator.css';

const SCREENS = {
  home: HomeScreen,
  documents: DocumentsScreen,
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

  if (showSymptomLog) {
    const symptomLogChild = children.find((item) => item.id === symptomLogChildId) || child;

    return (
      <SymptomLogScreen
        profile={profile}
        child={symptomLogChild}
        children={children}
        onExit={() => setShowSymptomLog(false)}
      />
    );
  }

  const Screen = SCREENS[currentScreen] || HomeScreen;
  const isFullscreen = FULLSCREEN_FLOW.has(currentScreen);

  return (
    <div className={`app-container${isFullscreen ? ' app-container--fullscreen' : ''}`}>
      <div className="content-area" ref={contentAreaRef}>
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
          onExit={() => navigateTo('home')}
          onBack={goBack}
        />
      </div>
      {!isFullscreen && (
        <BottomNav
          active={currentScreen}
          setActive={navigateTo}
          openChatModal={onOpenAi}
        />
      )}
    </div>
  );
}
