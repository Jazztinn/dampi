import { X, Stethoscope, ClipboardList, ClipboardCheck, FileText } from 'lucide-react';

const STEPS = [
  {
    Icon: Stethoscope,
    title: '1. Describe',
    body: "Tell Dampi what you're noticing in plain words. Add temperature or other vitals you have on hand. The more detail, the better the guidance.",
  },
  {
    Icon: ClipboardList,
    title: '2. Examine',
    body: 'Dampi suggests a short, calm at-home examination. Follow each step with your child. Open the camera guide to capture photos when useful.',
  },
  {
    Icon: ClipboardCheck,
    title: '3. Checklist',
    body: 'Record what you observed and rate the overall severity. Add any extra notes the doctor might want to know.',
  },
  {
    Icon: FileText,
    title: '4. Summary',
    body: 'Dampi compiles a clinical-style summary you can share with your pediatrician. You can save it as a PDF.',
  },
];

export default function FlowHelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="symptom-log__help-modal" role="dialog" aria-modal="true">
      <div className="symptom-log__help-backdrop" onClick={onClose} />
      <div className="symptom-log__help-sheet">
        <header className="symptom-log__help-head">
          <h2 className="symptom-log__help-title">How this works</h2>
          <button
            type="button"
            className="symptom-log__help-close"
            aria-label="Close help"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <ul className="symptom-log__help-list">
          {STEPS.map(({ Icon, title, body }) => (
            <li key={title} className="symptom-log__help-item">
              <Icon size={18} />
              <div>
                <p className="symptom-log__help-item-title">{title}</p>
                <p className="symptom-log__help-item-body">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="symptom-log__help-disclaimer">
          Dampi does not diagnose, prescribe, or replace medical care. If you suspect an emergency, call your local emergency number immediately.
        </p>
      </div>
    </div>
  );
}
