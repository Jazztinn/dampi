import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { callDampiChat } from '../../../services/ai/dampiApi.js';
import { STEP_HELP_SYSTEM_PROMPT } from '../prompts.js';

export default function StepHelpPanel({ step, stepIndex, cached, childAge, childName, onCache }) {
  const [text, setText] = useState(cached || '');
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cached) {
      setText(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const userMessage = [
          `Child: ${childName || 'the child'}${childAge ? `, ${childAge} old` : ''}`,
          `Step ${stepIndex + 1}${step?.title ? `: ${step.title}` : ''}`,
          step?.detail ? `Instruction: ${step.detail}` : null,
          step?.tip ? `Existing tip: ${step.tip}` : null,
        ].filter(Boolean).join('\n');
        const result = await callDampiChat([], userMessage, {
          systemPrompt: STEP_HELP_SYSTEM_PROMPT,
          mode: 'fast',
        });
        if (cancelled) return;
        const out = (result?.text || '').trim();
        setText(out);
        onCache?.(out);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || 'Could not load help.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cached, step, stepIndex, childAge, childName, onCache]);

  return (
    <div className="symptom-log__step-help">
      <div className="symptom-log__step-help-head">
        <Lightbulb size={14} />
        <span>What to look for</span>
      </div>
      {loading && (
        <p className="symptom-log__step-help-loading">
          <Loader2 size={14} className="symptom-log__spin" />
          <span>Asking Dampi…</span>
        </p>
      )}
      {error && !loading && (
        <p className="symptom-log__step-help-error">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </p>
      )}
      {!loading && !error && text && (
        <p className="symptom-log__step-help-text">{text}</p>
      )}
    </div>
  );
}
