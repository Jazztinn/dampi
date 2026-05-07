import { useState } from 'react';
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
  symptoms: FamilyScreen,
  hmo: HMOPortalScreen,
  profile: FinancialAssistanceScreen,
};

// Screens that take over the full app shell (no global bottom nav).
// If the SCREENS keys above are renamed, update this set too.
const FULLSCREEN_FLOW = new Set(['hmo']);

export default function AppNavigator({ profile, child, children = [], onOpenAi, onSignOut, onProfileChange }) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [showSymptomLog, setShowSymptomLog] = useState(false);

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

  const Screen = SCREENS[currentScreen] ?? HomeScreen;
  const isFullscreen = FULLSCREEN_FLOW.has(currentScreen);

  return (
    <div className={`app-container${isFullscreen ? ' app-container--fullscreen' : ''}`}>
      <div className="content-area">
        <Screen
          profile={profile}
          child={child}
          children={children}
          onOpenAi={onOpenAi}
          onSignOut={onSignOut}
          onProfileChange={onProfileChange}
          onNavigateToSymptoms={() => setShowSymptomLog(true)}
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
