import { useState } from 'react';
import { ClipboardList, ShieldPlus, HeartHandshake } from 'lucide-react';
import SymptomGuideScreen from '../screens/SymptomGuide/SymptomGuideScreen.jsx';
import HMOPortalScreen from '../screens/HMOPortal/HMOPortalScreen.jsx';
import FinancialAssistanceScreen from '../screens/FinancialAssistance/FinancialAssistanceScreen.jsx';

export default function AppNavigator({ onOpenAi }) {
  const [currentScreen, setCurrentScreen] = useState('symptom');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'symptom':
        return <SymptomGuideScreen />;
      case 'hmo':
        return <HMOPortalScreen />;
      case 'financial':
        return <FinancialAssistanceScreen />;
      default:
        return <SymptomGuideScreen />;
    }
  };

  const navContainerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e5e5',
    paddingBottom: 'env(safe-area-inset-bottom)', // Adjust for modern mobile screens
    height: '70px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 1000,
  };

  const buttonStyle = (screen) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: currentScreen === screen ? '#2563eb' : '#6b7280', // Active blue, inactive gray
    cursor: 'pointer',
    width: '100%',
    height: '100%',
    gap: '4px',
  });

  const labelStyle = (screen) => ({
    fontSize: '0.75rem',
    fontWeight: currentScreen === screen ? '600' : '400',
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      
      {/* Scrollable Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {renderScreen()}
      </div>

      {/* Bottom Navigation Bar */}
      <nav style={navContainerStyle}>
        <button style={buttonStyle('symptom')} onClick={() => setCurrentScreen('symptom')}>
          <ClipboardList size={24} />
          <span style={labelStyle('symptom')}>Gabay</span>
        </button>

        <button style={buttonStyle('hmo')} onClick={() => setCurrentScreen('hmo')}>
          <ShieldPlus size={24} />
          <span style={labelStyle('hmo')}>Benepisyo</span>
        </button>

        <button style={buttonStyle('financial')} onClick={() => setCurrentScreen('financial')}>
          <HeartHandshake size={24} />
          <span style={labelStyle('financial')}>Tulong</span>
        </button>
      </nav>
    </div>
  );
}
