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

  return (
    <div className="app-container">
      <div className="content-area">
        <Screen
          profile={profile}
          child={child}
          children={children}
          onOpenAi={onOpenAi}
          onSignOut={onSignOut}
          onProfileChange={onProfileChange}
          onNavigateToSymptoms={() => setShowSymptomLog(true)}
        />
      </div>
      <BottomNav
        active={currentScreen}
        setActive={setCurrentScreen}
        openChatModal={onOpenAi}
      />
    </div>
  );
}
