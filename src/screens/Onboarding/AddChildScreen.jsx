import { Baby, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getDobBounds, validateChildDob } from '../../utils/dobValidation.js';

export default function AddChildScreen({ data, onNext }) {
  const dobBounds = getDobBounds();
  const initialDob = validateChildDob(data.childDOB, { required: false }).valid ? data.childDOB || '' : '';
  const [formData, setFormData] = useState({
    childName: data.childName || '',
    childDOB: initialDob,
    childGender: data.childGender || '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'childDOB') {
      const result = validateChildDob(value, { required: false });
      if (value && !result.valid) {
        setErrors({ ...errors, childDOB: result.error });
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.childName) newErrors.childName = 'Child name is required';
    const dobResult = validateChildDob(formData.childDOB);
    if (!dobResult.valid) newErrors.childDOB = dobResult.error;
    if (!formData.childGender) newErrors.childGender = 'Gender is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(formData);
  };

  return (
    <div className="onboarding-screen-content">
      <div className="onboarding-header">
        <h2 className="brand-font">Add Your Child</h2>
        <p>Let's start by knowing your child</p>
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label htmlFor="childName">Child's Name</label>
          <div className="input-wrapper">
            <Baby size={18} className="input-icon" />
            <input
              id="childName"
              type="text"
              name="childName"
              placeholder="Child's full name"
              value={formData.childName}
              onChange={handleChange}
              className={errors.childName ? 'error' : ''}
            />
          </div>
          {errors.childName && <span className="error-text">{errors.childName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="childDOB">Date of Birth</label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input
              id="childDOB"
              type="date"
              name="childDOB"
              min={dobBounds.min}
              max={dobBounds.max}
              value={formData.childDOB}
              onChange={handleChange}
              className={errors.childDOB ? 'error' : ''}
            />
          </div>
          {errors.childDOB && <span className="error-text">{errors.childDOB}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="childGender">Gender</label>
          <select
            id="childGender"
            name="childGender"
            value={formData.childGender}
            onChange={handleChange}
            className={`onboarding-select ${errors.childGender ? 'error' : ''}`}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.childGender && <span className="error-text">{errors.childGender}</span>}
        </div>

        <button type="submit" className="onboarding-cta">
          Continue
          <ChevronRight size={18} />
        </button>
      </form>

      <p className="form-note">You can add medical history later if needed.</p>
    </div>
  );
}
