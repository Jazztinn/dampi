import { useState } from 'react';
import BottomNav from '../components/BottomNav.jsx';
import HomeScreen from '../screens/Home/HomeScreen.jsx';
import SymptomGuideScreen from '../screens/SymptomGuide/SymptomGuideScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';
import './app-navigator.css';

const SCREENS = {
  home:     HomeScreen,
  symptoms: SymptomGuideScreen,
  hmo:      HMOPortalScreen,
  profile:  FinancialAssistanceScreen,
};

export default function AppNavigator({ profile, child, children = [], onOpenAi }) {
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
