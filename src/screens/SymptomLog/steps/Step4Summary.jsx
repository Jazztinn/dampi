import { useState } from 'react';
import { Thermometer, HeartPulse, Activity, Stethoscope, FileText, History, FileWarning, ChevronDown } from 'lucide-react';

const NEXT_STEP_LABEL = {
  routine: 'Routine clinic visit',
  'same-day': 'Same-day clinic visit',
  'urgent-care': 'Urgent care',
  emergency: 'Emergency department',
};

function StatusPill({ status }) {
  const label = status === 'normal' ? 'Normal' : status === 'abnormal' ? 'Abnormal' : 'Inconclusive';
  return <span className={`symptom-log__status-pill symptom-log__status-pill--${status}`}>{label}</span>;
}

function fallback(value, placeholder = 'Not on file') {
  return value && String(value).trim() ? value : placeholder;
}

export default function Step4Summary({ summary, rawError, profile, reportId, reportDate }) {
  const [showRaw, setShowRaw] = useState(false);

  if (rawError) {
    return (
      <section className="symptom-log__panel">
        <div className="symptom-log__panel-head">
          <FileWarning size={20} />
          <div>
            <h2 className="symptom-log__panel-title">Couldn't format the summary</h2>
            <p className="symptom-log__panel-sub">
              Dampi returned an unexpected response. You can still copy the raw text below.
            </p>
          </div>
        </div>
        <div className="symptom-log__error">
          <span>{rawError.message}</span>
        </div>
        {rawError.raw && (
          <button
            type="button"
            className="symptom-log__secondary"
            onClick={() => setShowRaw((v) => !v)}
          >
            <ChevronDown size={16} />
            <span>{showRaw ? 'Hide raw response' : 'Show raw response'}</span>
          </button>
        )}
        {showRaw && rawError.raw && (
          <pre className="symptom-log__raw">{rawError.raw}</pre>
        )}
      </section>
    );
  }

  if (!summary) return null;

  const { patient, vitalSigns, chiefComplaint, history, examFindings, suggestedNextStep } = summary;

  return (
    <section className="symptom-log__summary-stack">
      <header className="symptom-log__summary-header">
        <div>
          <h2 className="symptom-log__summary-h">Clinical Summary</h2>
          <p className="symptom-log__summary-sub">Review the gathered data before sharing.</p>
        </div>
        <div className="symptom-log__summary-meta">
          <p className="symptom-log__meta-row">REPORT ID: <strong>{reportId}</strong></p>
          <p className="symptom-log__meta-row">{reportDate}</p>
        </div>
      </header>

      <article className="symptom-log__card symptom-log__card--patient">
        <div className="symptom-log__patient-grid">
          <div>
            <p className="symptom-log__kv-label">Patient name</p>
            <p className="symptom-log__kv-value">{fallback(patient?.name)}</p>
          </div>
          <div>
            <p className="symptom-log__kv-label">Age / Sex</p>
            <p className="symptom-log__kv-value">
              {fallback(patient?.ageDisplay, '—')}
              {patient?.gender ? ` / ${patient.gender}` : ''}
            </p>
          </div>
          <div>
            <p className="symptom-log__kv-label">Weight</p>
            <p className="symptom-log__kv-value">{fallback(patient?.weight)}</p>
          </div>
          <div>
            <p className="symptom-log__kv-label">Blood type</p>
            <p className="symptom-log__kv-value">{fallback(patient?.bloodType)}</p>
          </div>
        </div>
        {profile?.full_name && (
          <p className="symptom-log__patient-guardian">Recorded by {profile.full_name}</p>
        )}
      </article>

      <article className="symptom-log__card">
        <header className="symptom-log__card-head">
          <Thermometer size={16} />
          <h3 className="symptom-log__card-title">Vital signs</h3>
        </header>
        <div className="symptom-log__vitals-rows">
          <div className="symptom-log__vital-row">
            <span className="symptom-log__vital-label"><Thermometer size={14} /> Temperature</span>
            <span className={`symptom-log__vital-value${parseFloat(vitalSigns?.temperature) >= 38 ? ' symptom-log__vital-value--alert' : ''}`}>
              {fallback(vitalSigns?.temperature, '—')}
            </span>
          </div>
          <div className="symptom-log__vital-row">
            <span className="symptom-log__vital-label"><HeartPulse size={14} /> Heart rate</span>
            <span className="symptom-log__vital-value">{fallback(vitalSigns?.heartRate, '—')}</span>
          </div>
          <div className="symptom-log__vital-row">
            <span className="symptom-log__vital-label"><Activity size={14} /> Oxygen sat.</span>
            <span className="symptom-log__vital-value">{fallback(vitalSigns?.oxygenSat, '—')}</span>
          </div>
        </div>
      </article>

      <article className="symptom-log__card">
        <header className="symptom-log__card-head">
          <FileText size={16} />
          <h3 className="symptom-log__card-title">Chief complaint &amp; onset</h3>
        </header>
        {chiefComplaint?.quote && (
          <blockquote className="symptom-log__quote">"{chiefComplaint.quote}"</blockquote>
        )}
        {chiefComplaint?.tags?.length > 0 && (
          <div className="symptom-log__chip-row">
            {chiefComplaint.tags.map((tag, i) => (
              <span key={i} className="symptom-log__chip">{tag}</span>
            ))}
          </div>
        )}
      </article>

      <article className="symptom-log__card">
        <header className="symptom-log__card-head">
          <History size={16} />
          <h3 className="symptom-log__card-title">Relevant history</h3>
        </header>
        <ul className="symptom-log__history-list">
          <li>
            <span className="symptom-log__history-label">Allergies</span>
            <span className="symptom-log__history-value">{fallback(history?.allergies, 'None reported')}</span>
          </li>
          <li>
            <span className="symptom-log__history-label">Medications</span>
            <span className="symptom-log__history-value">{fallback(history?.medications, 'None reported')}</span>
          </li>
          <li>
            <span className="symptom-log__history-label">Chronic conditions</span>
            <span className="symptom-log__history-value">{fallback(history?.chronic, 'None reported')}</span>
          </li>
        </ul>
      </article>

      <article className="symptom-log__card">
        <header className="symptom-log__card-head">
          <Stethoscope size={16} />
          <h3 className="symptom-log__card-title">Examination findings</h3>
        </header>
        <ul className="symptom-log__findings-summary">
          {(examFindings || []).map((f, i) => (
            <li key={i} className="symptom-log__finding-summary-row">
              <div>
                <p className="symptom-log__finding-summary-label">{f.label}</p>
                {f.detail && <p className="symptom-log__finding-summary-detail">{f.detail}</p>}
              </div>
              <StatusPill status={f.status} />
            </li>
          ))}
        </ul>
      </article>

      {suggestedNextStep?.level && (
        <article className={`symptom-log__card symptom-log__card--next symptom-log__card--next-${suggestedNextStep.level}`}>
          <p className="symptom-log__next-label">Suggested next step</p>
          <p className="symptom-log__next-level">{NEXT_STEP_LABEL[suggestedNextStep.level]}</p>
          {suggestedNextStep.reason && (
            <p className="symptom-log__next-reason">{suggestedNextStep.reason}</p>
          )}
        </article>
      )}
    </section>
  );
}
