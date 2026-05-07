import { useState } from 'react';
import { ClipboardList, AlertTriangle, Camera, HelpCircle, Lightbulb, X } from 'lucide-react';
import CameraGuideModal from '../components/CameraGuideModal.jsx';
import StepHelpPanel from '../components/StepHelpPanel.jsx';

export default function Step2Examine({ plan, childName, childAge, findings, onChange }) {
  const [cameraOpenIndex, setCameraOpenIndex] = useState(null);
  const [helpOpenIndex, setHelpOpenIndex] = useState(null);

  if (!plan) return null;

  const examPhotos = findings?.examPhotos || {};
  const stepHelp = findings?.stepHelp || {};
  const set = (patch) => onChange?.({ ...findings, ...patch });

  const onCapture = (idx) => (dataUrl) => {
    set({
      examPhotos: {
        ...examPhotos,
        [idx]: { dataUrl, capturedAt: new Date().toISOString() },
      },
    });
    setCameraOpenIndex(null);
  };

  const removeExamPhoto = (idx) => {
    const next = { ...examPhotos };
    delete next[idx];
    set({ examPhotos: next });
  };

  const cacheStepHelp = (idx) => (text) => {
    set({ stepHelp: { ...stepHelp, [idx]: text } });
  };

  const cameraStep = cameraOpenIndex !== null ? plan.instructions[cameraOpenIndex] : null;

  return (
    <section className="symptom-log__panel">
      <div className="symptom-log__panel-head">
        <ClipboardList size={20} />
        <div>
          <h2 className="symptom-log__panel-title">Physical examination</h2>
          <p className="symptom-log__panel-sub">
            Follow these AI-guided steps to help us understand {childName}'s condition. Move slowly and remain calm.
          </p>
        </div>
      </div>

      <div className="symptom-log__exam-cards">
        {plan.instructions.map((step, i) => {
          const photo = examPhotos[i];
          const helpOpen = helpOpenIndex === i;
          return (
            <article key={i} className="symptom-log__exam-card">
              <div className="symptom-log__exam-num">{i + 1}</div>
              <div className="symptom-log__exam-body">
                {step.title && <h3 className="symptom-log__exam-title">{step.title}</h3>}
                {step.detail && <p className="symptom-log__exam-detail">{step.detail}</p>}
                {step.tip && (
                  <p className="symptom-log__exam-tip">
                    <Lightbulb size={14} />
                    <span>{step.tip}</span>
                  </p>
                )}
                {photo && (
                  <div className="symptom-log__photos symptom-log__photos--exam">
                    <div className="symptom-log__photo-thumb">
                      <img src={photo.dataUrl} alt={`Capture for step ${i + 1}`} />
                      <button
                        type="button"
                        className="symptom-log__photo-remove"
                        aria-label="Remove photo"
                        onClick={() => removeExamPhoto(i)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="symptom-log__exam-actions">
                  <button
                    type="button"
                    className="symptom-log__exam-camera"
                    onClick={() => setCameraOpenIndex(i)}
                  >
                    <Camera size={14} />
                    <span>{photo ? 'Retake photo' : 'Open Camera Guide'}</span>
                  </button>
                  <button
                    type="button"
                    className={`symptom-log__exam-help${helpOpen ? ' symptom-log__exam-help--active' : ''}`}
                    onClick={() => setHelpOpenIndex(helpOpen ? null : i)}
                    aria-expanded={helpOpen}
                  >
                    <HelpCircle size={14} />
                    <span>{helpOpen ? 'Hide help' : 'Need help with this step?'}</span>
                  </button>
                </div>
                {helpOpen && (
                  <StepHelpPanel
                    step={step}
                    stepIndex={i}
                    cached={stepHelp[i]}
                    childAge={childAge}
                    childName={childName}
                    onCache={cacheStepHelp(i)}
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>

      {plan.redFlags?.length > 0 && (
        <div className="symptom-log__redflags">
          <div className="symptom-log__redflags-head">
            <AlertTriangle size={16} />
            <span>Seek emergency care if you see any of these:</span>
          </div>
          <ul>
            {plan.redFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {cameraStep && (
        <CameraGuideModal
          step={cameraStep}
          onCapture={onCapture(cameraOpenIndex)}
          onClose={() => setCameraOpenIndex(null)}
        />
      )}
    </section>
  );
}
