import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  HelpCircle,
  FileText,
  RotateCcw,
  Share2,
} from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { callDampiChat } from '../../services/ai/dampiApi.js';
import {
  EXAM_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  extractJson,
  validateSummary,
  validatePlan,
} from './prompts.js';
import { emptyDraft, loadDraft, saveDraft, clearDraft } from './draftStorage.js';
import Step1Describe from './steps/Step1Describe.jsx';
import Step2Examine from './steps/Step2Examine.jsx';
import Step3Findings from './steps/Step3Findings.jsx';
import Step4Summary from './steps/Step4Summary.jsx';
import FlowHelpModal from './components/FlowHelpModal.jsx';
import './symptom-log.css';

const STEP_COUNT = 4;
const STEP_TITLES = ['Describe', 'Examine', 'Checklist', 'Summary'];

function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 24) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years}y ${rem}m` : `${years}y`;
}

function formatReportDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date.toUpperCase()} • ${time}`;
}

function genReportId() {
  return `#${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function durationText(d) {
  if (!d.duration) return '';
  if (d.duration === 'custom') return d.durationCustom;
  return ({
    'just-started': 'Just started',
    'few-hours': 'A few hours',
    'this-morning': 'Since this morning',
    '1-2-days': '1–2 days',
    '3-plus-days': '3+ days',
  })[d.duration] || d.duration;
}

export default function SymptomLogFlow({ onExit, profile, child }) {
  const [draft, setDraft] = useState(() => loadDraft() || emptyDraft());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(draft), 250);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [draft]);

  const childAge = useMemo(() => calcAge(child?.date_of_birth), [child?.date_of_birth]);
  const childName = child?.full_name || 'your child';

  const setDescribe = useCallback((describe) => setDraft((d) => ({ ...d, describe })), []);
  const setFindings = useCallback((findings) => setDraft((d) => ({ ...d, findings })), []);

  const step1Valid = useMemo(() => {
    const d = draft.describe;
    if (d.description.trim().length < 10) return false;
    if (!d.duration) return false;
    if (d.duration === 'custom' && !d.durationCustom.trim()) return false;
    return true;
  }, [draft.describe]);

  const step3Valid = useMemo(() => {
    if (!draft.plan) return false;
    if (draft.findings.overallSeverity === null || draft.findings.overallSeverity === undefined) return false;
    return draft.plan.checklist.every((q) => {
      const v = draft.findings.answers[q.id];
      return typeof v === 'string' ? v.trim().length > 0 : v !== undefined && v !== null;
    });
  }, [draft.plan, draft.findings]);

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    try {
      const d = draft.describe;
      const dur = durationText(d);
      const userMessage = [
        `Child: ${childName}${childAge ? `, ${childAge} old` : ''}${child?.gender ? `, ${child.gender}` : ''}`,
        `Parent's description: ${d.description.trim()}`,
        d.temperatureC ? `Temperature: ${d.temperatureC} °C` : null,
        d.heartRate ? `Heart rate: ${d.heartRate} bpm` : null,
        d.oxygenSat ? `Oxygen sat.: ${d.oxygenSat}%` : null,
        dur ? `Duration: ${dur}` : null,
        d.medicalHistory ? `Relevant medical history: ${d.medicalHistory}` : null,
      ].filter(Boolean).join('\n');

      const result = await callDampiChat([], userMessage, {
        systemPrompt: EXAM_SYSTEM_PROMPT,
        mode: 'fast',
      });
      const rawText = result?.text || '';
      let parsed;
      try {
        parsed = validatePlan(extractJson(rawText));
      } catch (parseErr) {
        console.error('AI Parse Error:', parseErr, 'Raw:', rawText);
        throw new Error(`Dampi gave an invalid response format. Raw: ${rawText.slice(0, 100)}...`);
      }
      setDraft((prev) => ({ ...prev, plan: parsed, step: 1 }));
    } catch (err) {
      setError(err.message || 'Could not generate examination plan.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const d = draft.describe;
      const examLines = draft.plan.checklist.map((q) => {
        const a = draft.findings.answers[q.id];
        const formatted = q.type === 'yesno' ? (a ? 'Yes' : 'No') : a;
        return `- ${q.question} → ${formatted}`;
      }).join('\n');

      const userMessage = [
        `Child profile: ${childName}${childAge ? `, ${childAge} old` : ''}${child?.gender ? `, ${child.gender}` : ''}`,
        child?.weight ? `Weight: ${child.weight}` : null,
        child?.blood_type ? `Blood type: ${child.blood_type}` : null,
        profile?.full_name ? `Recorded by: ${profile.full_name}` : null,
        '',
        `Parent's initial description: ${d.description.trim()}`,
        d.temperatureC ? `Reported temperature: ${d.temperatureC} °C` : null,
        d.heartRate ? `Heart rate: ${d.heartRate} bpm` : null,
        d.oxygenSat ? `Oxygen sat.: ${d.oxygenSat}%` : null,
        durationText(d) ? `Duration: ${durationText(d)}` : null,
        d.medicalHistory ? `Medical history: ${d.medicalHistory}` : null,
        '',
        'Home examination findings:',
        examLines,
        `Overall severity (parent's gut feel, 0-10): ${draft.findings.overallSeverity}`,
        draft.findings.notes ? `Additional notes: ${draft.findings.notes}` : null,
      ].filter(Boolean).join('\n');

      let parsed;
      let lastRaw = '';
      try {
        const result = await callDampiChat([], userMessage, {
          systemPrompt: SUMMARY_SYSTEM_PROMPT,
          mode: 'fast',
        });
        lastRaw = result?.text || '';
        parsed = validateSummary(extractJson(lastRaw));
      } catch {
        const retry = await callDampiChat(
          [{ role: 'user', text: userMessage }, { role: 'assistant', text: lastRaw }],
          'Your previous response was not valid JSON in the required schema. Return ONLY the JSON object now, no prose. DO NOT use markdown code blocks.',
          { systemPrompt: SUMMARY_SYSTEM_PROMPT, mode: 'fast' },
        );
        lastRaw = retry?.text || '';
        parsed = validateSummary(extractJson(lastRaw));
      }

      const reportMeta = {
        id: draft.summary?.reportId || genReportId(),
        date: new Date().toISOString(),
      };
      setDraft((prev) => ({
        ...prev,
        summary: { data: parsed, reportId: reportMeta.id, reportDate: reportMeta.date, rawError: null },
        step: 3,
      }));
    } catch (err) {
      setDraft((prev) => ({
        ...prev,
        summary: {
          data: null,
          reportId: prev.summary?.reportId || genReportId(),
          reportDate: new Date().toISOString(),
          rawError: { message: err.message || 'Could not parse Dampi response.', raw: '' },
        },
        step: 3,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (loading) return;
    if (draft.step === 0) return generatePlan();
    if (draft.step === 1) return setDraft((d) => ({ ...d, step: 2 }));
    if (draft.step === 2) return generateSummary();
  };

  const handleBack = () => {
    if (draft.step === 0) {
      onExit?.();
      return;
    }
    setDraft((d) => ({ ...d, step: d.step - 1 }));
  };

  const handleReset = () => {
    clearDraft();
    setDraft(emptyDraft());
    setError('');
  };

  const nextEnabled =
    (draft.step === 0 && step1Valid) ||
    (draft.step === 1 && draft.plan) ||
    (draft.step === 2 && step3Valid);

  const nextLabel =
    draft.step === 0 ? (loading ? 'Asking Dampi…' : 'Next: Clinical Check') :
    draft.step === 1 ? 'Next: Checklist' :
    draft.step === 2 ? (loading ? 'Generating summary…' : 'Generate Summary') :
    '';

  return (
    <div className="symptom-log">
      <TopNavBar
        variant="inner"
        transparent
        onBack={handleBack}
        title={
          <div className="symptom-log__progress">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`symptom-log__progress-pill${i <= draft.step ? ' symptom-log__progress-pill--active' : ''}`}
              />
            ))}
          </div>
        }
        extra={
          <button
            type="button"
            className="symptom-log__help-btn"
            title="How this works"
            aria-label="Help"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={20} />
          </button>
        }
      />

      <div className="symptom-log__sub-header">
        <p className="symptom-log__step-counter">Step {draft.step + 1} of {STEP_COUNT}</p>
        <h1 className="symptom-log__step-title">{STEP_TITLES[draft.step]}</h1>
        <p className="symptom-log__step-blurb">
          {draft.step === 0 && "Tell us what's happening. Your detailed notes help us provide better guidance for your child's care."}
          {draft.step === 1 && "Follow these AI-guided steps to help us understand your child's condition."}
          {draft.step === 2 && 'Review the findings from your physical examination and record the severity of each symptom.'}
          {draft.step === 3 && 'Review the gathered data before sharing.'}
        </p>
      </div>

      {error && (
        <div className="symptom-log__error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {draft.step === 0 && (
        <Step1Describe describe={draft.describe} childName={childName} onChange={setDescribe} />
      )}
      {draft.step === 1 && (
        <Step2Examine
          plan={draft.plan}
          childName={childName}
          childAge={childAge}
          findings={draft.findings}
          onChange={setFindings}
        />
      )}
      {draft.step === 2 && (
        <Step3Findings plan={draft.plan} findings={draft.findings} onChange={setFindings} />
      )}
      {draft.step === 3 && (
        <Step4Summary
          summary={draft.summary?.data}
          rawError={draft.summary?.rawError}
          profile={profile}
          reportId={draft.summary?.reportId || ''}
          reportDate={formatReportDate(draft.summary?.reportDate)}
        />
      )}

      <div className="symptom-log__cta-row">
        {draft.step < 3 && (
          <button
            type="button"
            className="symptom-log__primary"
            disabled={!nextEnabled || loading}
            onClick={handleNext}
          >
            {loading ? <Loader2 size={18} className="symptom-log__spin" /> : <ArrowRight size={18} />}
            <span>{nextLabel}</span>
          </button>
        )}

        {draft.step === 3 && (
          <>
            <button
              type="button"
              className="symptom-log__primary"
              title="Print or save as PDF"
              onClick={() => window.print()}
              disabled={!draft.summary?.data}
            >
              <Share2 size={18} />
              <span>Share Clinical PDF</span>
            </button>
            <button
              type="button"
              className="symptom-log__secondary"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Start over</span>
            </button>
          </>
        )}
      </div>

      {draft.step === 3 && (
        <p className="symptom-log__disclaimer">
          <FileText size={12} />
          <span>This summary is for clinical reference only. Ensure all data is accurate before finalizing.</span>
        </p>
      )}

      <FlowHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
