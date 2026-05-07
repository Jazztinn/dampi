import { ClipboardCheck, Gauge } from 'lucide-react';
import VoiceNoteButton from '../components/VoiceNoteButton.jsx';
import { PhotoAttachButton, PhotoThumbStrip } from '../components/PhotoAttachField.jsx';

function severityLabel(value) {
  if (value === null || value === undefined) return 'Move slider to rate';
  if (value <= 3) return `Mild (${value})`;
  if (value <= 6) return `Moderate (${value})`;
  return `Severe (${value})`;
}

export default function Step3Findings({ plan, findings, onChange }) {
  if (!plan) return null;
  const set = (patch) => onChange({ ...findings, ...patch });
  const setAnswer = (id, value) => set({ answers: { ...findings.answers, [id]: value } });
  const photos = findings.photos || [];
  const appendNote = (text) => {
    const sep = findings.notes && !findings.notes.endsWith(' ') ? ' ' : '';
    set({ notes: `${findings.notes || ''}${sep}${text}` });
  };
  const addPhoto = (photo) => set({ photos: [...photos, photo] });
  const removePhoto = (id) => set({ photos: photos.filter((p) => p.id !== id) });

  return (
    <section className="symptom-log__panel">
      <div className="symptom-log__panel-head">
        <ClipboardCheck size={20} />
        <div>
          <h2 className="symptom-log__panel-title">Post-exam checklist</h2>
          <p className="symptom-log__panel-sub">
            Review the findings from your physical examination and record the severity of each symptom.
          </p>
        </div>
      </div>

      <div className="symptom-log__findings-card">
        <p className="symptom-log__findings-title">Key findings</p>
        <div className="symptom-log__findings-list">
          {plan.checklist.map((q) => (
            <div key={q.id} className="symptom-log__finding-row">
              <p className="symptom-log__finding-q">{q.question}</p>
              {q.type === 'yesno' && (
                <div className="symptom-log__yesno">
                  {[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      className={`symptom-log__yesno-btn${findings.answers[q.id] === value ? ' symptom-log__yesno-btn--active' : ''}`}
                      onClick={() => setAnswer(q.id, value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <input
                  className="symptom-log__input"
                  placeholder={q.placeholder || 'Your answer'}
                  value={findings.answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="symptom-log__severity-card">
        <div className="symptom-log__severity-head">
          <Gauge size={18} />
          <h3 className="symptom-log__severity-title">Overall severity</h3>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={findings.overallSeverity ?? 5}
          onChange={(e) => set({ overallSeverity: parseInt(e.target.value, 10) })}
          onInput={(e) => set({ overallSeverity: parseInt(e.target.value, 10) })}
          className="symptom-log__severity-slider"
        />
        <div className="symptom-log__severity-scale">
          <span>Mild</span>
          <span className="symptom-log__severity-current">{severityLabel(findings.overallSeverity)}</span>
          <span>Severe</span>
        </div>
      </div>

      <label className="symptom-log__field">
        <span className="symptom-log__field-label symptom-log__field-label--upper">Additional clinical notes</span>
        <div className="symptom-log__textarea-wrap">
          <textarea
            className="symptom-log__textarea"
            placeholder="Describe any other observations or the child's general mood…"
            value={findings.notes}
            onChange={(e) => set({ notes: e.target.value })}
            rows={3}
          />
          <div className="symptom-log__textarea-icons">
            <VoiceNoteButton onTranscript={appendNote} />
            <PhotoAttachButton onAdd={addPhoto} />
          </div>
        </div>
        <PhotoThumbStrip photos={photos} onRemove={removePhoto} />
      </label>
    </section>
  );
}
