import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Baby, 
  Stethoscope, 
  Users, 
  FileText, 
  Shield, 
  Plus, 
  Trash2,
  ImagePlus,
  Upload
} from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './child-registration.css';

const STEPS = [
  { id: 'identity', label: 'Identity', Icon: Baby },
  { id: 'medical', label: 'Medical', Icon: Stethoscope },
  { id: 'guardian', label: 'Guardian', Icon: Users },
  { id: 'emergency', label: 'Emergency', Icon: Shield },
  { id: 'lifestyle', label: 'Lifestyle', Icon: FileText },
  { id: 'documents', label: 'Documents', Icon: FileText },
];

export default function ChildRegistrationFlow({ childId, onExit, onComplete }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: 'other',
    place_of_birth: '',
    nationality: 'Filipino',
    psa_number: '',
    blood_type: '',
    allergies: '',
    current_medications: '',
    chronic_conditions: '',
    past_medical_history: '',
    health_insurance_number: '',
    special_needs: '',
    dietary_restrictions: '',
    mental_health_considerations: '',
    emergency_contacts: [],
    marital_status: '',
    employment_occupation: '',
    home_address: '',
    religion: '',
    cultural_considerations: '',
    custody_info: '',
    school_name: '',
    school_grade: '',
    teacher_contact: '',
    languages_spoken: [],
  });

  useEffect(() => {
    const loadChildData = async () => {
      if (!childId) return;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: child, error: childError } = await supabase
          .from('children')
          .select('*')
          .eq('id', childId)
          .single();

        if (childError) throw childError;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('marital_status, employment_occupation, home_address')
          .eq('id', child.primary_guardian_id)
          .single();

        if (profileError) throw profileError;

        setFormData({
          ...formData,
          ...child,
          ...profile,
          emergency_contacts: child.emergency_contacts || [],
          school_name: child.school_info?.name || '',
          school_grade: child.school_info?.grade || '',
          teacher_contact: child.school_info?.teacher_contact || '',
          languages_spoken: child.languages_spoken || [],
        });
      } catch (err) {
        setError('Failed to load child data.');
      } finally {
        setLoading(false);
      }
    };

    loadChildData();
  }, [childId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else onExit();
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: [
        ...prev.emergency_contacts,
        { name: '', relationship: '', phone: '', can_pick_up: false }
      ]
    }));
  };

  const updateEmergencyContact = (index, field, value) => {
    const updated = [...formData.emergency_contacts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, emergency_contacts: updated }));
  };

  const removeEmergencyContact = (index) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Update child
      const { data: updatedChild, error: childError } = await supabase
        .from('children')
        .update({
          preferred_name: formData.preferred_name,
          place_of_birth: formData.place_of_birth,
          nationality: formData.nationality,
          psa_number: formData.psa_number,
          blood_type: formData.blood_type,
          allergies: formData.allergies,
          current_medications: formData.current_medications,
          chronic_conditions: formData.chronic_conditions,
          past_medical_history: formData.past_medical_history,
          health_insurance_number: formData.health_insurance_number,
          special_needs: formData.special_needs,
          dietary_restrictions: formData.dietary_restrictions,
          mental_health_considerations: formData.mental_health_considerations,
          emergency_contacts: formData.emergency_contacts,
          religion: formData.religion,
          cultural_considerations: formData.cultural_considerations,
          custody_info: formData.custody_info,
          languages_spoken: formData.languages_spoken,
          school_info: {
            name: formData.school_name,
            grade: formData.school_grade,
            teacher_contact: formData.teacher_contact,
          },
          registration_completed: true,
        })
        .eq('id', childId)
        .select()
        .single();

      if (childError) throw childError;

      // Update profile
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      let updatedProfile = null;
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .update({
            marital_status: formData.marital_status,
            employment_occupation: formData.employment_occupation,
            home_address: formData.home_address,
          })
          .eq('id', userId)
          .select()
          .single();
        if (profileError) throw profileError;
        updatedProfile = profile;
      }

      onComplete && onComplete({ child: updatedChild, profile: updatedProfile });
    } catch (err) {
      setError(err.message || 'Failed to save registration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="app-state"><p>Loading profile...</p></div>;

  return (
    <div className="child-reg">
      <TopNavBar 
        variant="inner" 
        title={
          <div className="child-reg__progress">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`child-reg__dot ${i <= step ? 'active' : ''}`} />
            ))}
          </div>
        } 
        onBack={handleBack} 
      />

      <div className="child-reg__content">
        <header className="child-reg__header">
          <div className="child-reg__icon-wrap">
            {(() => {
              const Icon = STEPS[step].Icon;
              return <Icon size={24} />;
            })()}
          </div>
          <h2 className="brand-font">{STEPS[step].label}</h2>
          <p>Step {step + 1} of {STEPS.length}</p>
        </header>

        {step === 0 && (
          <div className="child-reg__form">
            <div className="form-group">
              <label>Legal Full Name</label>
              <input type="text" name="full_name" value={formData.full_name} disabled />
            </div>
            <div className="form-group">
              <label>Preferred Name / Nickname</label>
              <input type="text" name="preferred_name" value={formData.preferred_name} onChange={handleChange} placeholder="e.g. Jun-jun" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} disabled />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} disabled>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Place of Birth</label>
              <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="City, Province" />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>PSA / Birth Certificate Number</label>
              <input type="text" name="psa_number" value={formData.psa_number} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="child-reg__form">
            <div className="form-row">
              <div className="form-group">
                <label>Blood Type</label>
                <select name="blood_type" value={formData.blood_type} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Health Insurance / PhilHealth</label>
                <input type="text" name="health_insurance_number" value={formData.health_insurance_number} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Allergies (Food, Meds, Env)</label>
              <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="List all known allergies..." />
            </div>
            <div className="form-group">
              <label>Current Medications</label>
              <textarea name="current_medications" value={formData.current_medications} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Chronic Conditions (e.g. Asthma)</label>
              <textarea name="chronic_conditions" value={formData.chronic_conditions} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Past Illnesses / Surgeries</label>
              <textarea name="past_medical_history" value={formData.past_medical_history} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="child-reg__form">
            <div className="form-group">
              <label>Marital Status</label>
              <select name="marital_status" value={formData.marital_status} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="separated">Separated</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employment / Occupation</label>
              <input type="text" name="employment_occupation" value={formData.employment_occupation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Home Address</label>
              <textarea name="home_address" value={formData.home_address} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="child-reg__form">
            <p className="child-reg__sub">Add at least 2 alternate contacts.</p>
            {formData.emergency_contacts.map((contact, i) => (
              <div key={i} className="child-reg__contact-card">
                <div className="contact-card__header">
                  <span>Contact #{i + 1}</span>
                  <button type="button" onClick={() => removeEmergencyContact(i)} className="remove-btn">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={contact.name} 
                    onChange={(e) => updateEmergencyContact(i, 'name', e.target.value)} 
                  />
                </div>
                <div className="form-row">
                  <input 
                    type="text" 
                    placeholder="Relationship" 
                    value={contact.relationship} 
                    onChange={(e) => updateEmergencyContact(i, 'relationship', e.target.value)} 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    value={contact.phone} 
                    onChange={(e) => updateEmergencyContact(i, 'phone', e.target.value)} 
                  />
                </div>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={contact.can_pick_up} 
                    onChange={(e) => updateEmergencyContact(i, 'can_pick_up', e.target.checked)} 
                  />
                  Authorized to pick up child
                </label>
              </div>
            ))}
            <button type="button" className="add-contact-btn" onClick={addEmergencyContact}>
              <Plus size={16} /> Add Emergency Contact
            </button>
            <div className="form-group mt-4">
              <label>Custody / Legal Arrangements</label>
              <textarea name="custody_info" value={formData.custody_info} onChange={handleChange} placeholder="e.g. Sole custody, visiting rights..." />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="child-reg__form">
            <div className="form-group">
              <label>Religion / Beliefs</label>
              <input type="text" name="religion" value={formData.religion} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Cultural Considerations</label>
              <textarea name="cultural_considerations" value={formData.cultural_considerations} onChange={handleChange} />
            </div>
            <hr className="child-reg__divider" />
            <div className="form-group">
              <label>School Name</label>
              <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Grade Level</label>
                <input type="text" name="school_grade" value={formData.school_grade} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Teacher Contact</label>
                <input type="text" name="teacher_contact" value={formData.teacher_contact} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="child-reg__form">
             <p className="child-reg__sub">Upload digital copies for easy access.</p>
             <div className="doc-upload-list">
                {['Birth Certificate', 'Parent ID', 'Vaccination Record', 'Insurance Card'].map(doc => (
                  <div key={doc} className="doc-upload-item">
                    <div className="doc-info">
                      <FileText size={20} />
                      <span>{doc}</span>
                    </div>
                    <button className="upload-btn">
                      <Upload size={16} />
                    </button>
                  </div>
                ))}
             </div>
             <p className="child-reg__legal-note">
               By completing this registration, you confirm that the information provided is accurate and you have the legal right to provide this data.
             </p>
          </div>
        )}

        {error && <p className="child-reg__error">{error}</p>}

        <footer className="child-reg__actions">
          {step < STEPS.length - 1 ? (
            <button className="onboarding-cta" onClick={handleNext}>
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button className="onboarding-cta" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Finish Registration'} <Save size={18} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
