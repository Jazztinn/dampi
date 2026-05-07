import { AlertTriangle, Check, ChevronDown, ExternalLink, FileText, Loader2, RotateCcw, Save, Stethoscope } from 'lucide-react';
import { getQuickLogMissingRequired, getSelectedChild, QUICK_LOG_STATUS } from './quickSymptomLog.js';

function Field({ label, value, onChange, placeholder, textarea = false, type = 'text' }) {
  const Input = textarea ? 'textarea' : 'input';
  return (
    <label className="quick-log__field">
      <span>{label}</span>
      <Input
        type={textarea ? undefined : type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DisplayRow({ label, value }) {
  return (
    <div className="quick-log__review-row">
      <span>{label}</span>
      <strong>{value && String(value).trim() ? value : 'Not provided'}</strong>
    </div>
  );
}

export default function QuickSymptomLogPanel({
  quickLog,
  children = [],
  extracting = false,
  summarizing = false,
  saving = false,
  onUpdate,
  onStart,
  onDiscard,
  onToggleExpanded,
  onReview,
  onEdit,
  onSave,
  onOpenFull,
  onNewLog,
}) {
  if (!quickLog || quickLog.status === QUICK_LOG_STATUS.inactive) return null;

  const child = getSelectedChild(children, quickLog.selectedChildId);
  const missingRequired = getQuickLogMissingRequired(quickLog);
  const isCapture = quickLog.status === QUICK_LOG_STATUS.capture;
  const isReview = quickLog.status === QUICK_LOG_STATUS.review;
  const isSaved = quickLog.status === QUICK_LOG_STATUS.saved;
  const summaryLine = [
    child?.full_name,
    quickLog.chiefComplaint,
    quickLog.duration,
    quickLog.severity ? `severity ${quickLog.severity}` : '',
  ].filter(Boolean).join(' · ') || 'Resume symptom log';

  if (!quickLog.expanded && !isReview && !isSaved) {
    return (
      <section className="quick-log quick-log--collapsed">
        <button type="button" className="quick-log__collapsed-btn" onClick={onToggleExpanded}>
          <span className="quick-log__collapsed-icon"><Stethoscope size={15} /></span>
          <span>
            <strong>Quick symptom log</strong>
            <small>{summaryLine}</small>
          </span>
          {extracting ? <Loader2 size={15} className="spin" /> : <ChevronDown size={16} />}
        </button>
      </section>
    );
  }

  return (
    <section className={`quick-log quick-log--${quickLog.status}`}>
      <header className="quick-log__header">
        <div>
          <div className="quick-log__progress" aria-hidden="true">
            <span className="quick-log__pill quick-log__pill--active" />
            <span className={`quick-log__pill${isReview || isSaved ? ' quick-log__pill--active' : ''}`} />
          </div>
          <p className="quick-log__eyebrow">{isReview ? 'Step 2 of 2' : isSaved ? 'Saved' : 'Step 1 of 2'}</p>
          <h3>{isReview ? 'Review symptom log' : isSaved ? 'Symptom log saved' : 'Quick symptom log'}</h3>
        </div>
        <button type="button" className="quick-log__icon-btn" onClick={onToggleExpanded} aria-label="Collapse quick symptom log">
          <ChevronDown size={16} />
        </button>
      </header>

      {quickLog.error && (
        <div className="quick-log__error" role="alert">
          <AlertTriangle size={15} />
          <span>{quickLog.error}</span>
        </div>
      )}

      {isSaved && (
        <>
          <div className="quick-log__saved-card">
            <Check size={18} />
            <div>
              <strong>{quickLog.chiefComplaint || 'Symptom log'}</strong>
              <span>{child?.full_name || 'Child'} · {quickLog.savedAt ? new Date(quickLog.savedAt).toLocaleString() : 'Saved'}</span>
            </div>
          </div>
          <div className="quick-log__actions">
            <button type="button" className="quick-log__primary" onClick={onOpenFull}>
              <ExternalLink size={15} />
              <span>View full log</span>
            </button>
            <button type="button" className="quick-log__secondary" onClick={onNewLog}>
              <RotateCcw size={15} />
              <span>New symptom log</span>
            </button>
          </div>
        </>
      )}

      {isCapture && (
        <>
          {children.length > 1 && (
            <div className="quick-log__children">
              {children.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`quick-log__child${item.id === quickLog.selectedChildId ? ' quick-log__child--active' : ''}`}
                  onClick={() => onUpdate({ selectedChildId: item.id })}
                >
                  {item.full_name}
                </button>
              ))}
            </div>
          )}
          {children.length === 0 && (
            <div className="quick-log__warning">
              <AlertTriangle size={15} />
              <span>Add a child profile before saving this log.</span>
            </div>
          )}
          <div className="quick-log__grid">
            <Field label="Chief complaint" value={quickLog.chiefComplaint} placeholder="Fever and cough" onChange={(chiefComplaint) => onUpdate({ chiefComplaint })} />
            <Field label="Duration" value={quickLog.duration} placeholder="Since yesterday morning" onChange={(duration) => onUpdate({ duration })} />
            <Field label="Severity" value={quickLog.severity} placeholder="0-10 or low/medium/high" onChange={(severity) => onUpdate({ severity })} />
            <Field label="Temperature" value={quickLog.temperature} placeholder="38.2 C" onChange={(temperature) => onUpdate({ temperature })} />
            <Field label="Heart rate" value={quickLog.heartRate} placeholder="Optional" onChange={(heartRate) => onUpdate({ heartRate })} />
            <Field label="Oxygen sat." value={quickLog.oxygenSat} placeholder="Optional" onChange={(oxygenSat) => onUpdate({ oxygenSat })} />
          </div>
          <Field
            label="Associated symptoms"
            value={quickLog.associatedSymptoms.join(', ')}
            placeholder="vomiting, rash, poor appetite"
            onChange={(value) => onUpdate({ associatedSymptoms: value.split(',').map((item) => item.trim()).filter(Boolean) })}
          />
          <Field label="Medications given" value={quickLog.medicationsGiven} placeholder="Optional" onChange={(medicationsGiven) => onUpdate({ medicationsGiven })} />
          <Field label="Medical history" value={quickLog.medicalHistory} placeholder="Optional" onChange={(medicalHistory) => onUpdate({ medicalHistory })} />
          <Field label="Parent notes" value={quickLog.parentNotes} placeholder="Anything else you noticed" textarea onChange={(parentNotes) => onUpdate({ parentNotes })} />
          {extracting && (
            <div className="quick-log__status"><Loader2 size={14} className="spin" /> Updating from chat...</div>
          )}
          {missingRequired.length > 0 && (
            <div className="quick-log__missing">Needed before saving: {missingRequired.join(', ')}.</div>
          )}
          <div className="quick-log__actions">
            <button type="button" className="quick-log__primary" disabled={summarizing} onClick={onReview}>
              {summarizing ? <Loader2 size={15} className="spin" /> : <FileText size={15} />}
              <span>Review before saving</span>
            </button>
            <button type="button" className="quick-log__secondary" onClick={onOpenFull}>
              <ExternalLink size={15} />
              <span>Open full symptom log</span>
            </button>
            <button type="button" className="quick-log__text-btn" onClick={onDiscard}>Discard</button>
          </div>
        </>
      )}

      {isReview && (
        <>
          <div className="quick-log__review">
            <DisplayRow label="Child" value={child?.full_name} />
            <DisplayRow label="Chief complaint" value={quickLog.chiefComplaint} />
            <DisplayRow label="Duration" value={quickLog.duration} />
            <DisplayRow label="Severity" value={quickLog.severity} />
            <DisplayRow label="Temperature" value={quickLog.temperature} />
            <DisplayRow label="Heart rate" value={quickLog.heartRate} />
            <DisplayRow label="Oxygen sat." value={quickLog.oxygenSat} />
            <DisplayRow label="Associated symptoms" value={quickLog.associatedSymptoms.join(', ')} />
            <DisplayRow label="Medications" value={quickLog.medicationsGiven} />
            <DisplayRow label="Medical history" value={quickLog.medicalHistory} />
          </div>
          <div className="quick-log__summary-card">
            <h4>AI summary</h4>
            <p>{quickLog.summaryText || 'Not provided'}</p>
            {quickLog.redFlags.length > 0 && (
              <>
                <h4>Red flags</h4>
                <ul>{quickLog.redFlags.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </>
            )}
            {quickLog.recommendedNextSteps.length > 0 && (
              <>
                <h4>Recommended next steps</h4>
                <ul>{quickLog.recommendedNextSteps.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </>
            )}
            {quickLog.missingInformation.length > 0 && (
              <div className="quick-log__missing">Missing info: {quickLog.missingInformation.join(', ')}</div>
            )}
          </div>
          {missingRequired.length > 0 && (
            <div className="quick-log__warning">
              <AlertTriangle size={15} />
              <span>Add {missingRequired.join(', ')} before saving.</span>
            </div>
          )}
          <div className="quick-log__actions">
            <button type="button" className="quick-log__primary" disabled={saving || missingRequired.length > 0} onClick={onSave}>
              {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              <span>Save symptom log</span>
            </button>
            <button type="button" className="quick-log__secondary" onClick={onEdit}>Edit in chat</button>
            <button type="button" className="quick-log__secondary" onClick={onOpenFull}>
              <ExternalLink size={15} />
              <span>Open full symptom log</span>
            </button>
          </div>
        </>
      )}

      {!isCapture && !isReview && !isSaved && (
        <button type="button" className="quick-log__primary" onClick={onStart}>Start quick log</button>
      )}
    </section>
  );
}
