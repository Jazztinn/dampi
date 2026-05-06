import { useState } from 'react';
import FloatingNav from './FloatingNav.jsx';
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

export default function AppNavigator({ onOpenAi }) {
  const [currentScreen, setCurrentScreen] = useState('home');

  const Screen = SCREENS[currentScreen] ?? HomeScreen;

  return (
    <div className="app-container">
      <FloatingNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />

      <div className="content-area">
        <Screen
          onOpenAi={onOpenAi}
          onNavigateToSymptoms={() => setCurrentScreen('symptoms')}
          onBack={() => setCurrentScreen('home')}
        />
      </div>
    </div>
  );
}
