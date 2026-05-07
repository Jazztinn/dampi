import { Building2, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function HMOCoverageScreen({ data, onNext }) {
  const [formData, setFormData] = useState({
    hmoHasCoverage: data.hmoHasCoverage || '',
    hmoProviderName: data.hmoProviderName || '',
    hmoBenefitsTier: data.hmoBenefitsTier || '',
    hmoBenefitsNotes: data.hmoBenefitsNotes || '',
  });
  const [errors, setErrors] = useState({});
  const hasCoverage = formData.hmoHasCoverage === 'yes';

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next = { ...formData, [name]: value };

    if (name === 'hmoHasCoverage' && value === 'no') {
      next.hmoProviderName = '';
      next.hmoBenefitsTier = '';
      next.hmoBenefitsNotes = '';
    }

    setFormData(next);
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!formData.hmoHasCoverage) newErrors.hmoHasCoverage = 'Choose whether you have HMO coverage';
    if (hasCoverage && !formData.hmoProviderName.trim()) newErrors.hmoProviderName = 'Provider name is required';
    if (hasCoverage && !formData.hmoBenefitsTier.trim()) newErrors.hmoBenefitsTier = 'Benefits or tier is required';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onNext({
      ...formData,
      hmoProviderName: formData.hmoProviderName.trim(),
      hmoBenefitsTier: formData.hmoBenefitsTier.trim(),
      hmoBenefitsNotes: formData.hmoBenefitsNotes.trim(),
    });
  };

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2 className="brand-font">HMO Coverage</h2>
        <p>Add coverage details for faster approval requests</p>
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="family-info">
          <ShieldCheck size={40} className="info-icon" />
          <p>These details stay on your profile so you do not need to re-enter them during HMO requests.</p>
        </div>

        <div className="form-group">
          <label htmlFor="hmoHasCoverage">Do you have HMO coverage?</label>
          <select
            id="hmoHasCoverage"
            name="hmoHasCoverage"
            value={formData.hmoHasCoverage}
            onChange={handleChange}
            className={`onboarding-select ${errors.hmoHasCoverage ? 'error' : ''}`}
          >
            <option value="">Select one</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {errors.hmoHasCoverage && <span className="error-text">{errors.hmoHasCoverage}</span>}
        </div>

        {hasCoverage && (
          <>
            <div className="form-group">
              <label htmlFor="hmoProviderName">Provider Name</label>
              <div className="input-wrapper">
                <Building2 size={18} className="input-icon" />
                <input
                  id="hmoProviderName"
                  name="hmoProviderName"
                  type="text"
                  placeholder="HMO provider"
                  value={formData.hmoProviderName}
                  onChange={handleChange}
                  className={errors.hmoProviderName ? 'error' : ''}
                />
              </div>
              {errors.hmoProviderName && <span className="error-text">{errors.hmoProviderName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hmoBenefitsTier">Benefits or Tier</label>
              <div className="input-wrapper">
                <FileText size={18} className="input-icon" />
                <input
                  id="hmoBenefitsTier"
                  name="hmoBenefitsTier"
                  type="text"
                  placeholder="Plan tier or benefits"
                  value={formData.hmoBenefitsTier}
                  onChange={handleChange}
                  className={errors.hmoBenefitsTier ? 'error' : ''}
                />
              </div>
              {errors.hmoBenefitsTier && <span className="error-text">{errors.hmoBenefitsTier}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hmoBenefitsNotes">Coverage Notes</label>
              <textarea
                id="hmoBenefitsNotes"
                name="hmoBenefitsNotes"
                rows={3}
                placeholder="Specific benefits, approval notes, or exclusions"
                value={formData.hmoBenefitsNotes}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <button type="submit" className="onboarding-cta">
          Continue
          <ChevronRight size={18} />
        </button>
      </form>

      <p className="form-note">You can update these details later from the HMO page.</p>
    </div>
  );
}
