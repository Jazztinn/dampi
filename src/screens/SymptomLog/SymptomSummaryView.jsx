import { AlertTriangle, Share2, ArrowLeft, Pill, Clock, Thermometer } from 'lucide-react';
import './symptom-summary.css';

function SummarySection({ title, children, icon: Icon }) {
  if (!children) return null;
  return (
    <div className="symptom-summary__section">
      <div className="symptom-summary__section-header">
        {Icon && <Icon size={15} strokeWidth={2} />}
        <h4>{title}</h4>
      </div>
      <div className="symptom-summary__section-body">{children}</div>
    </div>
  );
}

export default function SymptomSummaryView({ summary, onBack, onShare }) {
  if (!summary) return null;

  const hasRedFlags = summary.red_flags_noted && summary.red_flags_noted.length > 0;

  function handleShare() {
    if (navigator.share) {
      const text = formatSummaryText(summary);
      navigator.share({ title: `Symptom Summary — ${summary.child_name}`, text }).catch(() => {});
    } else if (onShare) {
      onShare();
    }
  }

  return (
    <div className="symptom-summary">
      <div className="symptom-summary__top-bar">
        <button className="symptom-summary__back" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h2 className="symptom-summary__title">Doctor Summary</h2>
        <button className="symptom-summary__share" onClick={handleShare}>
          <Share2 size={18} strokeWidth={2} />
        </button>
      </div>

      {hasRedFlags && (
        <div className="symptom-summary__red-flag">
          <AlertTriangle size={18} />
          <div>
            <p className="symptom-summary__red-flag-title">Warning Signs Detected</p>
            <ul>
              {summary.red_flags_noted.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="symptom-summary__patient-header">
        <h3>{summary.child_name}</h3>
        <p>{summary.child_age} • {summary.date_of_visit}</p>
      </div>

      <div className="symptom-summary__chief">
        <p className="symptom-summary__chief-label">Chief Complaint</p>
        <p className="symptom-summary__chief-text">{summary.chief_complaint}</p>
      </div>

      <SummarySection title="History of Present Illness" icon={Clock}>
        <p>{summary.history_of_present_illness}</p>
      </SummarySection>

      {summary.associated_symptoms?.length > 0 && (
        <SummarySection title="Associated Symptoms">
          <div className="symptom-summary__tag-list">
            {summary.associated_symptoms.map((s, i) => (
              <span key={i} className="symptom-summary__tag">{s}</span>
            ))}
          </div>
        </SummarySection>
      )}

      <SummarySection title="Onset & Duration">
        <p>{summary.onset_and_duration}</p>
      </SummarySection>

      {(summary.aggravating_factors?.length > 0 || summary.relieving_factors?.length > 0) && (
        <SummarySection title="Aggravating / Relieving Factors">
          {summary.aggravating_factors?.length > 0 && (
            <p><strong>Worse with:</strong> {summary.aggravating_factors.join(', ')}</p>
          )}
          {summary.relieving_factors?.length > 0 && (
            <p><strong>Better with:</strong> {summary.relieving_factors.join(', ')}</p>
          )}
        </SummarySection>
      )}

      {summary.vital_signs && (
        <SummarySection title="Vital Signs" icon={Thermometer}>
          {summary.vital_signs.temperature && <p><strong>Temp:</strong> {summary.vital_signs.temperature}</p>}
          {summary.vital_signs.breathing && <p><strong>Breathing:</strong> {summary.vital_signs.breathing}</p>}
          {summary.vital_signs.hydration && <p><strong>Hydration:</strong> {summary.vital_signs.hydration}</p>}
        </SummarySection>
      )}

      {summary.medications_taken?.length > 0 && (
        <SummarySection title="Medications Taken" icon={Pill}>
          {summary.medications_taken.map((med, i) => (
            <div key={i} className="symptom-summary__med">
              <p className="symptom-summary__med-name">{med.name}</p>
              <p className="symptom-summary__med-detail">
                {[med.dose, med.frequency, med.last_taken ? `Last: ${med.last_taken}` : ''].filter(Boolean).join(' • ')}
              </p>
            </div>
          ))}
        </SummarySection>
      )}

      <SummarySection title="Allergies">
        <p>{summary.allergies || 'None known'}</p>
      </SummarySection>

      <SummarySection title="Past Medical History">
        <p>{summary.past_medical_history || 'None reported'}</p>
      </SummarySection>

      {summary.parent_concerns && (
        <SummarySection title="Parent Concerns">
          <p>{summary.parent_concerns}</p>
        </SummarySection>
      )}

      {summary.ai_triage_note && (
        <div className="symptom-summary__triage-note">
          <p className="symptom-summary__triage-label">Triage Note</p>
          <p>{summary.ai_triage_note}</p>
        </div>
      )}

      <button className="symptom-summary__share-btn" onClick={handleShare}>
        <Share2 size={16} strokeWidth={2} />
        Share with Doctor
      </button>
    </div>
  );
}

function formatSummaryText(summary) {
  const lines = [
    `SYMPTOM SUMMARY — ${summary.child_name}`,
    `Age: ${summary.child_age} | Date: ${summary.date_of_visit}`,
    '',
    `CHIEF COMPLAINT: ${summary.chief_complaint}`,
    '',
    `HISTORY: ${summary.history_of_present_illness}`,
  ];

  if (summary.associated_symptoms?.length) {
    lines.push('', `ASSOCIATED SYMPTOMS: ${summary.associated_symptoms.join(', ')}`);
  }
  if (summary.onset_and_duration) {
    lines.push('', `ONSET/DURATION: ${summary.onset_and_duration}`);
  }
  if (summary.medications_taken?.length) {
    lines.push('', 'MEDICATIONS:');
    summary.medications_taken.forEach((med) => {
      lines.push(`  - ${med.name} ${med.dose || ''} ${med.frequency || ''}`);
    });
  }
  if (summary.allergies) {
    lines.push('', `ALLERGIES: ${summary.allergies}`);
  }
  if (summary.ai_triage_note) {
    lines.push('', `TRIAGE: ${summary.ai_triage_note}`);
  }

  return lines.join('\n');
}
