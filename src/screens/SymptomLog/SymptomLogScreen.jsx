import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader, AlertTriangle } from 'lucide-react';
import ChildSelector from '../../components/symptom/ChildSelector.jsx';
import QuestionCard from '../../components/symptom/QuestionCard.jsx';
import SymptomSummaryView from './SymptomSummaryView.jsx';
import { streamDampiChat } from '../../services/ai/dampiApi.js';
import { SYMPTOM_SYSTEM_PROMPT } from '../../constants/symptomPrompt.js';
import {
  createSymptomLog,
  completeSymptomLog,
} from '../../services/symptomLog/symptomLogPersistence.js';
import './symptom-log.css';

const INITIAL_MESSAGE = 'Hi! I\'m ready to help you log symptoms for your child. Let me ask a few questions so we can prepare a clear summary for the doctor.\n\nAno po ang nangyayari? (What\'s happening with your child?)';

function getChildAge(dateOfBirth) {
  if (!dateOfBirth) return '';
  const birth = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} mo` : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}

export default function SymptomLogScreen({ profile, child, children = [], onBack }) {
  const [selectedChildId, setSelectedChildId] = useState(child?.id || children[0]?.id || null);
  const [phase, setPhase] = useState('questions'); // questions | loading-summary | summary
  const [questions, setQuestions] = useState([]);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [logId, setLogId] = useState(null);

  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const startedRef = useRef(false);

  const selectedChild = children.find((c) => c.id === selectedChildId) || child;

  // Start the flow with the first question
  useEffect(() => {
    if (startedRef.current || !selectedChildId) return;
    startedRef.current = true;
    startFlow();
  }, [selectedChildId]);

  // Auto-scroll to bottom when new questions appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [questions, streamingText]);

  async function startFlow() {
    try {
      const log = await createSymptomLog(selectedChildId);
      setLogId(log.id);
    } catch {
      // Non-critical — log won't be persisted but flow still works
    }

    // Show the first AI question
    setQuestions([{
      id: 'initial',
      question: INITIAL_MESSAGE,
      options: ['May lagnat (Fever)', 'Umuubo (Coughing)', 'May rashes (Rash)', 'Sumasakit tiyan (Stomach ache)'],
      allowFreeText: true,
      inputPlaceholder: 'Describe what\'s happening...',
    }]);
  }

  const sendAnswer = useCallback(async (answerText) => {
    if (isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setStreamingText('');

    // Build conversation history for the AI
    const newMessages = [
      ...conversationMessages,
      { role: 'user', text: answerText },
    ];
    setConversationMessages(newMessages);

    // Build system prompt with child context
    const childContext = selectedChild
      ? `\n\nCHILD INFO: Name: ${selectedChild.full_name}, Age: ${getChildAge(selectedChild.date_of_birth)}, Gender: ${selectedChild.gender || 'not specified'}`
      : '';
    const systemPrompt = SYMPTOM_SYSTEM_PROMPT + childContext;

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const result = await streamDampiChat(
        newMessages.slice(0, -1).map((m) => ({ role: m.role, text: m.text })),
        answerText,
        {
          systemPrompt,
          mode: 'default',
          signal: abortController.signal,
          onEvent: (event) => {
            if (event.type === 'text') {
              setStreamingText((prev) => prev + event.text);
            }
          },
        },
      );

      // Add assistant message to conversation
      const assistantText = result.text || '';
      setConversationMessages((prev) => [...prev, { role: 'assistant', text: assistantText }]);
      setStreamingText('');

      // Check if AI generated a summary (flow complete)
      if (result.taskActions?.generateSummary && result.taskActions.generateSummary.chief_complaint) {
        const generatedSummary = {
          ...result.taskActions.generateSummary,
          child_name: selectedChild?.full_name || 'Child',
          child_age: getChildAge(selectedChild?.date_of_birth),
          date_of_visit: new Date().toISOString().split('T')[0],
        };
        setSummary(generatedSummary);
        setPhase('summary');

        // Persist to database
        if (logId) {
          completeSymptomLog(logId, {
            summary: generatedSummary,
            summaryText: formatPlainSummary(generatedSummary),
            chiefComplaint: generatedSummary.chief_complaint,
          }).catch(() => {});
        }
      } else if (result.taskActions?.askQuestions?.length > 0) {
        // AI asked follow-up questions
        setQuestions((prev) => [
          ...prev,
          ...result.taskActions.askQuestions.map((q, i) => ({
            ...q,
            id: q.id || `q-${Date.now()}-${i}`,
            aiMessage: assistantText,
          })),
        ]);
      } else {
        // AI responded with text but no structured questions — create a free-text question
        setQuestions((prev) => [
          ...prev,
          {
            id: `q-${Date.now()}`,
            question: assistantText,
            options: [],
            allowFreeText: true,
            inputPlaceholder: 'Your answer...',
          },
        ]);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong. Please try again.');
      // Allow retry by unsticking the last question
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, conversationMessages, selectedChild, logId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  if (phase === 'summary' && summary) {
    return <SymptomSummaryView summary={summary} onBack={onBack} />;
  }

  return (
    <div className="symptom-log">
      <div className="symptom-log__header">
        <button className="symptom-log__back" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="symptom-log__header-text">
          <h2>Symptom Log</h2>
          {selectedChild && (
            <p className="symptom-log__child-label">
              for {selectedChild.full_name}
            </p>
          )}
        </div>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={setSelectedChildId}
      />

      <div className="symptom-log__scroll" ref={scrollRef}>
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            question={q.question}
            options={q.options}
            allowFreeText={q.allowFreeText}
            inputPlaceholder={q.inputPlaceholder}
            onAnswer={sendAnswer}
            isLatest={index === questions.length - 1 && !isStreaming}
          />
        ))}

        {isStreaming && (
          <div className="symptom-log__streaming">
            <div className="symptom-log__typing-indicator">
              <span /><span /><span />
            </div>
            {streamingText && (
              <p className="symptom-log__streaming-text">{streamingText}</p>
            )}
          </div>
        )}

        {error && (
          <div className="symptom-log__error">
            <AlertTriangle size={16} />
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPlainSummary(summary) {
  const lines = [
    `SYMPTOM SUMMARY — ${summary.child_name}`,
    `Age: ${summary.child_age} | Date: ${summary.date_of_visit}`,
    '',
    `CHIEF COMPLAINT: ${summary.chief_complaint}`,
    `HISTORY: ${summary.history_of_present_illness || ''}`,
  ];
  if (summary.medications_taken?.length) {
    lines.push('', 'MEDICATIONS:');
    summary.medications_taken.forEach((m) => lines.push(`  - ${m.name} ${m.dose || ''}`));
  }
  if (summary.ai_triage_note) {
    lines.push('', `TRIAGE: ${summary.ai_triage_note}`);
  }
  return lines.join('\n');
}
