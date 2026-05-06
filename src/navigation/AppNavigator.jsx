import { useState } from 'react';
import BottomNav from '../components/BottomNav.jsx';
import HomeScreen from '../screens/Home/HomeScreen.jsx';
import FamilyScreen from '../screens/Family/FamilyScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';
import './app-navigator.css';

const SCREENS = {
  home: HomeScreen,
  symptoms: FamilyScreen,
  hmo: HMOPortalScreen,
  profile: FinancialAssistanceScreen,
};

export default function AppNavigator({ profile, child, children = [], onOpenAi, onSignOut }) {
  const [currentScreen, setCurrentScreen] = useState('home');

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
          onNavigateToSymptoms={() => setCurrentScreen('symptoms')}
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
