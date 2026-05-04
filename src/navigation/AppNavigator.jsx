import { useState } from 'react';
import { Heart, Calendar, MessageSquare, User, Plus } from 'lucide-react';
import SymptomGuideScreen from '../screens/SymptomGuide/SymptomGuideScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';
import HomeScreen from '../screens/Home/HomeScreen.jsx';
import './app-navigator.css';

export default function AppNavigator({ onOpenAi }) {
  const [currentScreen, setCurrentScreen] = useState('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'calendar':
        return <SymptomGuideScreen />;
      case 'messages':
        return <HMOPortalScreen />;
      case 'profile':
        return <FinancialAssistanceScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="app-container">
      {/* Scrollable Content Area */}
      <div className="content-area">
        {renderScreen()}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav-bar-container">
        <div className="bottom-nav-bar">
          <div className="nav-group left">
            <button 
              className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('home')}
            >
              <Heart size={24} strokeWidth={currentScreen === 'home' ? 2.5 : 2} />
            </button>
            <button 
              className={`nav-item ${currentScreen === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('calendar')}
            >
              <Calendar size={24} strokeWidth={currentScreen === 'calendar' ? 2.5 : 2} />
            </button>
          </div>

          {/* Center Floating Button */}
          <div className="center-button-wrapper">
            <button className="center-action-btn" onClick={() => onOpenAi?.('text')}>
              <Plus size={28} color="black" strokeWidth={3} />
            </button>
            {/* Cutout illusion using pseudo-elements in CSS */}
            <div className="cutout-background"></div>
          </div>

          <div className="nav-group right">
            <button 
              className={`nav-item ${currentScreen === 'messages' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('messages')}
            >
              <MessageSquare size={24} strokeWidth={currentScreen === 'messages' ? 2.5 : 2} />
            </button>
            <button 
              className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('profile')}
            >
              <User size={24} strokeWidth={currentScreen === 'profile' ? 2.5 : 2} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
