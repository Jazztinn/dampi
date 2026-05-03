import { useState } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import DampiFab from './components/ai/DampiFab.jsx';
import DampiChatModal from './components/ai/DampiChatModal.jsx';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState({});

  return (
    <div className="dampi-app">
      <AppNavigator onOpenAi={() => setChatOpen(true)} />
      <DampiFab onOpenChat={() => setChatOpen(true)} />
      <DampiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
