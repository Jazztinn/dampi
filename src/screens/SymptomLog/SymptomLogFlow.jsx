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
  ANALYSIS_SYSTEM_PROMPT,
  EXAM_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  extractJson,
  validateSummary,
  validatePlan,
  validateAnalysis,
} from './prompts.js';
import { emptyDraft, loadDraft, saveDraft, clearDraft } from './draftStorage.js';
import Step1Describe from './steps/Step1Describe.jsx';
import Step2Examine from './steps/Step2Examine.jsx';
import Step3Findings from './steps/Step3Findings.jsx';
import Step4Summary from './steps/Step4Summary.jsx';
import FlowHelpModal from './components/FlowHelpModal.jsx';
import { formatChildAge } from '../../utils/dobValidation.js';
import {
  createAssessmentSession,
  updateAssessmentSession,
  generateProviderExports,
} from '../../services/ai/assessmentAdapter.js';
import './symptom-log.css';

const STEP_COUNT = 4;
const STEP_TITLES = ['Describe', 'Examine', 'Checklist', 'Summary'];

function calcAge(dob) {
  const age = formatChildAge(dob);
  return age === 'Date unavailable' ? '' : age;
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
  const [assessmentSession, setAssessmentSession] = useState(null);
  const saveTimer = useRef(null);

  // Initialize assessment session on mount
  useEffect(() => {
    if (!assessmentSession && child?.id) {
      const session = createAssessmentSession(
        child?.full_name || 'Child',
        child?.date_of_birth ? calcAge(child.date_of_birth) : null,
        child?.id,
        profile?.id || null
      );
      setAssessmentSession(session);
    }
  }, [child?.id, profile?.id, assessmentSession]);

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
      // Step 1: Capture step 1 data in assessment session
      let session = updateAssessmentSession(assessmentSession, 1, {
        description: draft.describe.description.trim(),
        temperatureC: draft.describe.temperatureC || '',
        heartRate: draft.describe.heartRate || '',
        oxygenSat: draft.describe.oxygenSat || '',
        photos: draft.describe.photos || [],
      });

      // Step 2 & 3: Dynamic exam and checklist are generated automatically in updateAssessmentSession
      const plan = session.step2.plan;

      if (!plan || !plan.instructions) {
        throw new Error('Failed to generate examination plan');
      }

      setAssessmentSession(session);
      setDraft((prev) => ({ ...prev, plan, step: 1 }));
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
      // Step 3: Capture step 3 data in assessment session
      let session = updateAssessmentSession(assessmentSession, 3, {
        answers: draft.findings.answers,
        severityRating: draft.findings.overallSeverity,
        notes: draft.findings.notes || '',
        photos: draft.findings.photos || [],
      });

      // Build session summary context for AI
      const examLines = draft.plan.checklist.map((q) => {
        const a = draft.findings.answers[q.id];
        const formatted = q.type === 'yesno' ? (a ? 'Yes' : 'No') : a;
        return `- ${q.question} → ${formatted}`;
      }).join('\n');

      const isGuest = !profile?.id;

      const userMessage = [
        `Child profile: ${childName}${childAge ? `, ${childAge} old` : ''}${child?.gender ? `, ${child.gender}` : ''}`,
        !isGuest && child?.weight ? `Weight: ${child.weight}` : null,
        !isGuest && child?.blood_type ? `Blood type: ${child.blood_type}` : null,
        !isGuest && child?.health_insurance_number ? `HMO ID: ${child.health_insurance_number}` : null,
        profile?.full_name ? `Recorded by: ${profile.full_name}` : null,
        `Guest User: ${isGuest}`,
        '',
        `Assessment Context: ${JSON.stringify(session.metadata.context)}`,
        `Parent's initial description: ${draft.describe.description.trim()}`,
        draft.describe.temperatureC ? `Reported temperature: ${draft.describe.temperatureC} °C` : null,
        draft.describe.heartRate ? `Heart rate: ${draft.describe.heartRate} bpm` : null,
        draft.describe.oxygenSat ? `Oxygen sat.: ${draft.describe.oxygenSat}%` : null,
        durationText(draft.describe) ? `Duration: ${durationText(draft.describe)}` : null,
        !isGuest && draft.describe.medicalHistory ? `Medical history: ${draft.describe.medicalHistory}` : null,
        !isGuest && child?.allergies ? `Allergies: ${child.allergies}` : null,
        '',
        'Home examination findings:',
        examLines,
        `Overall severity (parent's assessment, 0-10): ${draft.findings.overallSeverity}`,
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
          [{ role: 'user', content: userMessage }, { role: 'assistant', content: lastRaw }],
          'Your previous response was not valid JSON in the required schema. Return ONLY the JSON object now, no prose. DO NOT use markdown code blocks.',
          { systemPrompt: SUMMARY_SYSTEM_PROMPT, mode: 'fast' },
        );
        lastRaw = retry?.text || '';
        parsed = validateSummary(extractJson(lastRaw));
      }

      // Step 4: Complete assessment session and generate exports
      session = updateAssessmentSession(session, 4, {
        exportReady: true,
        exported: false,
      });

      const reportMeta = {
        id: draft.summary?.reportId || genReportId(),
        date: new Date().toISOString(),
      };

      // Generate provider exports using assessment context
      const exports = generateProviderExports(session.step4.summary || {});

      setAssessmentSession(session);
      setDraft((prev) => ({
        ...prev,
        summary: {
          data: parsed,
          reportId: reportMeta.id,
          reportDate: reportMeta.date,
          rawError: null,
          assessmentSession: session,
          exports,
        },
        step: 3,
      }));
    } catch (err) {
      setDraft((prev) => ({
        ...prev,
        summary: {
          data: null,
          reportId: draft.summary?.reportId || genReportId(),
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
    setAssessmentSession(null);
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
        <h1 className="symptom-log__step-title brand-font">{STEP_TITLES[draft.step]}</h1>
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
          assessmentSession={draft.summary?.assessmentSession}
          exports={draft.summary?.exports}
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
