import { useState } from 'react';
import AppNavigator from './navigation/AppNavigator.jsx';
import DampiChatModal from './components/ai/DampiChatModal.jsx';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState({});

  return (
    <div className="dampi-app">
      <AppNavigator onOpenAi={() => setChatOpen(true)} />
      <DampiChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
