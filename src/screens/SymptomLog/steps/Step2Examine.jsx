import { ClipboardList, AlertTriangle, Camera, HelpCircle, Lightbulb } from 'lucide-react';

export default function Step2Examine({ plan, childName }) {
  if (!plan) return null;

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
        {plan.instructions.map((step, i) => (
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
              <div className="symptom-log__exam-actions">
                <button
                  type="button"
                  className="symptom-log__exam-camera"
                  title="Camera guide — coming soon"
                >
                  <Camera size={14} />
                  <span>Open Camera Guide</span>
                </button>
                <button
                  type="button"
                  className="symptom-log__exam-help"
                  title="Step help — coming soon"
                >
                  <HelpCircle size={14} />
                  <span>Need help with this step?</span>
                </button>
              </div>
            </div>
          </article>
        ))}
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
    </section>
  );
}
