import { useState } from 'react';
import ChatFab from '../ai/components/ChatFab.jsx';
import ChatModal from '../ai/components/ChatModal.jsx';
import AppNavigator from './navigation/AppNavigator.jsx';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <AppNavigator onOpenAi={() => setChatOpen(true)} />
      <ChatFab onClick={() => setChatOpen(true)} />
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
