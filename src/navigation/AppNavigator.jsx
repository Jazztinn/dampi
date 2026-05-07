import { useLayoutEffect, useRef, useState } from 'react';
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
const FULLSCREEN_FLOW = new Set(['hmo-log-flow']); 

export default function AppNavigator({ profile, child, children = [], onOpenAi, onSignOut, onProfileChange }) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSymptomLog, setShowSymptomLog] = useState(false);
  const contentAreaRef = useRef(null);

  useLayoutEffect(() => {
    if (showSymptomLog) return;

    const container = contentAreaRef.current;
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [currentScreen, showSymptomLog]);

  // Allow both the dedicated tab AND the home screen shortcut to trigger the flow
  if (showSymptomLog) {
    return (
      <SymptomLogScreen
        profile={profile}
        child={child}
        children={children}
        onBack={() => setShowSymptomLog(false)}
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
          onOpenAi={onOpenAi}
          onSignOut={onSignOut}
          onProfileChange={onProfileChange}
          onNavigateToSymptoms={() => setCurrentScreen('symptoms')}
          onExit={() => setCurrentScreen('home')}
          onBack={() => setCurrentScreen('home')}
        />
      </div>
      {!isFullscreen && (
        <BottomNav
          active={currentScreen}
          setActive={setCurrentScreen}
          openChatModal={onOpenAi}
        />
      )}
    </div>
  );
}
