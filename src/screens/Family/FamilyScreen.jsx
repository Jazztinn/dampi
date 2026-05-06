import { useState, useEffect } from 'react';
import { Users, Mail, Baby, Calendar, Plus, X, ChevronRight, UserPlus } from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './family.css';

function formatAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 24) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

function GenderChip({ gender }) {
  return (
    <span className={`family__gender-chip family__gender-chip--${gender}`}>
      {gender}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`family__status-badge family__status-badge--${status}`}>
      {status}
    </span>
  );
}

function ChildCard({ child }) {
  return (
    <div className="family__child-card">
      <div className="family__child-avatar">
        <Baby size={18} strokeWidth={2} />
      </div>
      <div className="family__child-info">
        <p className="family__child-name">{child.full_name}</p>
        <p className="family__child-meta">{formatAge(child.date_of_birth)} old</p>
      </div>
      <GenderChip gender={child.gender} />
    </div>
  );
}

function AddChildSheet({ children: existingChildren, profileId, onAdd, onClose }) {
  const [formData, setFormData] = useState({ full_name: '', date_of_birth: '', gender: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('children')
        .insert({ primary_guardian_id: profileId, ...formData, full_name: formData.full_name.trim() })
        .select()
        .single();
      if (error) throw error;
      onAdd(data);
    } catch (err) {
      setSubmitError(err.message || 'Could not add child.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="family__sheet-overlay" onClick={onClose}>
      <div className="family__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="family__sheet-header">
          <p className="family__sheet-title">Add a Child</p>
          <button className="family__sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="family__sheet-form">
          <div className="family__form-group">
            <label htmlFor="fc-name">Child's Name</label>
            <div className="family__input-wrap">
              <Baby size={16} className="family__input-icon" />
              <input
                id="fc-name"
                name="full_name"
                type="text"
                placeholder="Full name"
                value={formData.full_name}
                onChange={handleChange}
                className={errors.full_name ? 'family__input family__input--error' : 'family__input'}
              />
            </div>
            {errors.full_name && <span className="family__error">{errors.full_name}</span>}
          </div>

          <div className="family__form-group">
            <label htmlFor="fc-dob">Date of Birth</label>
            <div className="family__input-wrap">
              <Calendar size={16} className="family__input-icon" />
              <input
                id="fc-dob"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                className={errors.date_of_birth ? 'family__input family__input--error' : 'family__input'}
              />
            </div>
            {errors.date_of_birth && <span className="family__error">{errors.date_of_birth}</span>}
          </div>

          <div className="family__form-group">
            <label htmlFor="fc-gender">Gender</label>
            <select
              id="fc-gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={errors.gender ? 'family__select family__select--error' : 'family__select'}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <span className="family__error">{errors.gender}</span>}
          </div>

          {submitError && <p className="family__error">{submitError}</p>}

          <button type="submit" className="family__sheet-cta" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Child'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteSheet({ children, profileId, onAdd, onClose }) {
  const [email, setEmail] = useState('');
  const [childId, setChildId] = useState(children[0]?.id || '');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setSubmitError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('caregiver_invites')
        .insert({
          inviter_profile_id: profileId,
          child_id: childId || null,
          invitee_email: email.trim().toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setSubmitError('Already invited — a pending invite exists for this email.');
        } else {
          throw error;
        }
        return;
      }
      onAdd(data);
    } catch (err) {
      setSubmitError(err.message || 'Could not send invite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="family__sheet-overlay" onClick={onClose}>
      <div className="family__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="family__sheet-header">
          <p className="family__sheet-title">Invite a Caregiver</p>
          <button className="family__sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="family__sheet-form">
          <div className="family__form-group">
            <label htmlFor="inv-email">Email Address</label>
            <div className="family__input-wrap">
              <Mail size={16} className="family__input-icon" />
              <input
                id="inv-email"
                type="email"
                placeholder="Caregiver email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                className={emailError ? 'family__input family__input--error' : 'family__input'}
              />
            </div>
            {emailError && <span className="family__error">{emailError}</span>}
          </div>

          {children.length > 0 && (
            <div className="family__form-group">
              <label htmlFor="inv-child">Link to Child</label>
              <select
                id="inv-child"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="family__select"
              >
                <option value="">No specific child</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {submitError && <p className="family__error">{submitError}</p>}

          <button type="submit" className="family__sheet-cta" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FamilyScreen({ profile, children: initialChildren = [], onBack }) {
  const [localChildren, setLocalChildren] = useState(initialChildren);
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!profile?.id) { setLoadingInvites(false); return; }
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('caregiver_invites')
      .select('*')
      .eq('inviter_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setInvites(data);
        setLoadingInvites(false);
      });
  }, [profile?.id]);

  const handleChildAdded = (child) => {
    setLocalChildren((prev) => [...prev, child]);
    setShowAddChild(false);
  };

  const handleInviteAdded = (invite) => {
    setInvites((prev) => [invite, ...prev]);
    setShowInvite(false);
  };

  return (
    <div className="family">
      <TopNavBar variant="inner" title="Family" onBack={onBack} />

      {/* ── Children ── */}
      <p className="family__section-title">Your Children</p>
      <div className="family__children-list">
        {localChildren.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
        <button className="family__add-card" onClick={() => setShowAddChild(true)}>
          <div className="family__add-icon">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span className="family__add-label">Add a Child</span>
          <ChevronRight size={16} color="var(--dampi-text-muted)" strokeWidth={2} />
        </button>
      </div>

      {/* ── Caregivers ── */}
      <div className="family__caregivers-header">
        <p className="family__section-title">Caregivers</p>
        {invites.length > 0 && (
          <button className="family__invite-btn-sm" onClick={() => setShowInvite(true)}>
            <UserPlus size={14} strokeWidth={2} />
            Invite
          </button>
        )}
      </div>

      {loadingInvites ? (
        <p className="family__loading">Loading…</p>
      ) : invites.length === 0 ? (
        <div className="family__empty">
          <div className="family__empty-icon">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <p className="family__empty-title">No caregivers yet</p>
          <p className="family__empty-desc">
            Invite a grandparent, co-parent, or caregiver to help track your child's health.
          </p>
          <button className="family__invite-cta" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} strokeWidth={2} />
            Invite a Caregiver
          </button>
        </div>
      ) : (
        <div className="family__invite-list">
          {invites.map((inv) => (
            <div key={inv.id} className="family__invite-row">
              <div className="family__invite-icon">
                <Mail size={15} strokeWidth={2} />
              </div>
              <div className="family__invite-info">
                <p className="family__invite-email">{inv.invitee_email}</p>
                {inv.child_id && (
                  <p className="family__invite-child">
                    {localChildren.find((c) => c.id === inv.child_id)?.full_name || 'Child'}
                  </p>
                )}
              </div>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      )}

      {showAddChild && (
        <AddChildSheet
          children={localChildren}
          profileId={profile?.id}
          onAdd={handleChildAdded}
          onClose={() => setShowAddChild(false)}
        />
      )}

      {showInvite && (
        <InviteSheet
          children={localChildren}
          profileId={profile?.id}
          onAdd={handleInviteAdded}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
