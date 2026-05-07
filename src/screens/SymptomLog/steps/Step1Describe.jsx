import { Stethoscope, Thermometer, HeartPulse, Activity, Mic, Camera, Plus, Minus } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 'just-started', label: 'Just started' },
  { value: 'few-hours', label: 'A few hours' },
  { value: 'this-morning', label: 'Since this morning' },
  { value: '1-2-days', label: '1–2 days' },
  { value: '3-plus-days', label: '3+ days' },
  { value: 'custom', label: 'Custom…' },
];

export default function Step1Describe({ describe, childName, onChange }) {
  const set = (patch) => onChange({ ...describe, ...patch });

  return (
    <section className="symptom-log__panel">
      <div className="symptom-log__panel-head">
        <Stethoscope size={20} />
        <div>
          <h2 className="symptom-log__panel-title">Describe what's happening</h2>
          <p className="symptom-log__panel-sub">
            Tell Dampi what you're seeing with {childName}. Add any facts you can.
          </p>
        </div>
      </div>

      <label className="symptom-log__field">
        <span className="symptom-log__field-label">What are you noticing? *</span>
        <div className="symptom-log__textarea-wrap">
          <textarea
            className="symptom-log__textarea"
            placeholder="e.g. He's been crying non-stop for 2 hours, won't eat, and feels warm to the touch. Small red rash on his stomach."
            value={describe.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={5}
          />
          <div className="symptom-log__textarea-icons">
            <button
              type="button"
              className="symptom-log__icon-btn"
              title="Voice notes — coming soon"
              aria-label="Voice notes (coming soon)"
            >
              <Mic size={16} />
            </button>
            <button
              type="button"
              className="symptom-log__icon-btn"
              title="Attach photo — coming soon"
              aria-label="Attach photo (coming soon)"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>
      </label>

      <div className="symptom-log__vitals-grid">
        <label className="symptom-log__field">
          <span className="symptom-log__field-label">Temperature (°C)</span>
          <div className="symptom-log__input-wrap">
            <Thermometer size={14} className="symptom-log__input-icon" />
            <input
              className="symptom-log__input symptom-log__input--with-icon"
              placeholder="38.5"
              inputMode="decimal"
              value={describe.temperatureC}
              onChange={(e) => set({ temperatureC: e.target.value })}
            />
          </div>
        </label>
        <label className="symptom-log__field">
          <span className="symptom-log__field-label">Heart rate (bpm)</span>
          <div className="symptom-log__input-wrap">
            <HeartPulse size={14} className="symptom-log__input-icon" />
            <input
              className="symptom-log__input symptom-log__input--with-icon"
              placeholder="optional"
              inputMode="numeric"
              value={describe.heartRate}
              onChange={(e) => set({ heartRate: e.target.value })}
            />
          </div>
        </label>
        <label className="symptom-log__field">
          <span className="symptom-log__field-label">Oxygen sat. (%)</span>
          <div className="symptom-log__input-wrap">
            <Activity size={14} className="symptom-log__input-icon" />
            <input
              className="symptom-log__input symptom-log__input--with-icon"
              placeholder="optional"
              inputMode="numeric"
              value={describe.oxygenSat}
              onChange={(e) => set({ oxygenSat: e.target.value })}
            />
          </div>
        </label>
      </div>

      <label className="symptom-log__field">
        <span className="symptom-log__field-label">Duration *</span>
        <select
          className="symptom-log__input symptom-log__select"
          value={describe.duration}
          onChange={(e) => set({ duration: e.target.value })}
        >
          <option value="">Select duration…</option>
          {DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      {describe.duration === 'custom' && (
        <label className="symptom-log__field">
          <span className="symptom-log__field-label">Custom duration</span>
          <input
            className="symptom-log__input"
            placeholder="e.g. since 3pm yesterday"
            value={describe.durationCustom}
            onChange={(e) => set({ durationCustom: e.target.value })}
          />
        </label>
      )}

      <div className="symptom-log__expandable">
        <button
          type="button"
          className="symptom-log__expandable-head"
          onClick={() => set({ historyExpanded: !describe.historyExpanded })}
          aria-expanded={describe.historyExpanded}
        >
          <div>
            <p className="symptom-log__expandable-title">Relevant medical history</p>
            <p className="symptom-log__expandable-sub">Optional: Add recent allergies or medications</p>
          </div>
          <span className="symptom-log__expandable-icon">
            {describe.historyExpanded ? <Minus size={18} /> : <Plus size={18} />}
          </span>
        </button>
        {describe.historyExpanded && (
          <textarea
            className="symptom-log__textarea"
            placeholder="Allergies, recent illnesses, medications, conditions…"
            value={describe.medicalHistory}
            onChange={(e) => set({ medicalHistory: e.target.value })}
            rows={3}
          />
        )}
      </div>
    </section>
  );
}
