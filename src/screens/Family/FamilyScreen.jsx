import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Baby,
  Calendar,
  Check,
  ChevronRight,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import { formatChildAge, getDobBounds, validateChildDob } from '../../utils/dobValidation.js';
import './family.css';

function formatAge(dob) {
  const age = formatChildAge(dob);
  if (age === 'Date unavailable' || age.startsWith('Expected')) return age;
  return `${age} old`;
}

function formatRelationship(value) {
  return value === 'caregiver' ? 'Caregiver' : 'Family';
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
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

function PersonAvatar({ avatarUrl, name }) {
  return (
    <div className="family__person-avatar">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="family__person-avatar-image" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}

function ChildCard({ child }) {
  const ageText = formatAge(child.date_of_birth);

  return (
    <div className="family__child-card">
      <div className="family__child-avatar">
        <Baby size={18} strokeWidth={2} />
      </div>
      <div className="family__child-info">
        <p className="family__child-name">{child.full_name}</p>
        <p className="family__child-meta">{ageText}</p>
      </div>
      <GenderChip gender={child.gender} />
    </div>
  );
}

function AddChildSheet({ profileId, onAdd, onClose }) {
  const dobBounds = getDobBounds();
  const [formData, setFormData] = useState({ full_name: '', date_of_birth: '', gender: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitLock = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date_of_birth') {
      const result = validateChildDob(value, { required: false });
      if (value && !result.valid) {
        setErrors((prev) => ({ ...prev, date_of_birth: result.error }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || submitLock.current) return;

    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required';
    const dobResult = validateChildDob(formData.date_of_birth);
    if (!dobResult.valid) newErrors.date_of_birth = dobResult.error;
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    submitLock.current = true;
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
      submitLock.current = false;
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
                min={dobBounds.min}
                max={dobBounds.max}
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
            {submitting ? 'Adding...' : 'Add Child'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteSheet({ children, profileId, onSent, onEmailInviteAdded, onClose }) {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [relationshipType, setRelationshipType] = useState('family');
  const [childId, setChildId] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    const trimmed = query.trim();
    const rpcName = trimmed ? 'search_care_circle_profiles' : 'suggest_care_circle_profiles';
    const args = trimmed ? { p_query: trimmed, p_limit: 12 } : { p_limit: 8 };

    setLoadingProfiles(true);
    supabase.rpc(rpcName, args).then(({ data, error }) => {
      if (!active) return;
      setProfiles(error ? [] : data || []);
      setLoadingProfiles(false);
    });

    return () => {
      active = false;
    };
  }, [query]);

  const sendCareCircleRequest = async (e) => {
    e.preventDefault();
    if (!selectedProfile || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc('send_care_circle_request', {
        p_recipient_profile_id: selectedProfile.id,
        p_relationship_type: relationshipType,
        p_child_id: relationshipType === 'caregiver' ? childId || null : null,
      });

      if (error) throw error;
      onSent();
    } catch (err) {
      setSubmitError(err.message || 'Could not send care-circle request.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendEmailInvite = async (e) => {
    e.preventDefault();
    if (submitting) return;

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
          child_id: childId || children[0]?.id || null,
          invitee_email: email.trim().toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setSubmitError('Already invited. A pending invite exists for this email.');
          return;
        }
        throw error;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.functions.invoke('send-caregiver-invite', {
          body: { inviteId: data.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {
        // Email delivery failure is non-fatal; invite row already exists.
      }

      onEmailInviteAdded(data);
      onSent();
    } catch (err) {
      setSubmitError(err.message || 'Could not send invite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="family__sheet-overlay" onClick={onClose}>
      <div className="family__sheet family__sheet--tall" onClick={(e) => e.stopPropagation()}>
        <div className="family__sheet-header">
          <p className="family__sheet-title">Add to Care Circle</p>
          <button className="family__sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="family__sheet-form">
          <div className="family__form-group">
            <label htmlFor="care-search">Search Dampi users</label>
            <div className="family__input-wrap">
              <Search size={16} className="family__input-icon" />
              <input
                id="care-search"
                type="search"
                placeholder="Search by name, email, or phone"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedProfile(null);
                  setSubmitError('');
                }}
                className="family__input"
              />
            </div>
          </div>

          <div className="family__search-results">
            {loadingProfiles ? (
              <p className="family__loading family__loading--compact">Loading...</p>
            ) : profiles.length === 0 ? (
              <p className="family__muted">
                {query.trim() ? 'No discoverable Dampi users found.' : 'No suggestions yet.'}
              </p>
            ) : (
              profiles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selectedProfile?.id === item.id
                      ? 'family__person-row family__person-row--selected'
                      : 'family__person-row'
                  }
                  onClick={() => {
                    setSelectedProfile(item);
                    setSubmitError('');
                  }}
                >
                  <PersonAvatar avatarUrl={item.avatar_url} name={item.full_name} />
                  <span>
                    <strong>{item.full_name}</strong>
                    <small>Do you know {item.full_name}?</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))
            )}
          </div>

          {selectedProfile && (
            <form className="family__request-panel" onSubmit={sendCareCircleRequest}>
              <p className="family__request-title">Request {selectedProfile.full_name}</p>
              <div className="family__form-group">
                <label htmlFor="relationship-type">Role</label>
                <select
                  id="relationship-type"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="family__select"
                >
                  <option value="family">Family</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              {relationshipType === 'caregiver' && children.length > 0 && (
                <div className="family__form-group">
                  <label htmlFor="request-child">Child access</label>
                  <select
                    id="request-child"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="family__select"
                  >
                    <option value="">No child access yet</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {submitError && <p className="family__error">{submitError}</p>}

              <button type="submit" className="family__sheet-cta" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          )}

          <form className="family__email-invite" onSubmit={sendEmailInvite}>
            <div className="family__divider">
              <span>Invite by email</span>
            </div>
            <div className="family__form-group">
              <label htmlFor="inv-email">Email Address</label>
              <div className="family__input-wrap">
                <Mail size={16} className="family__input-icon" />
                <input
                  id="inv-email"
                  type="email"
                  placeholder="Caregiver email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setSubmitError('');
                  }}
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
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            {!selectedProfile && submitError && <p className="family__error">{submitError}</p>}

            <button type="submit" className="family__secondary-cta" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Email Invite'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FamilyScreen({
  profile,
  children: initialChildren = [],
  onBack,
  onChildrenChange,
  onProfileChange,
  onNavigateToAddChild,
}) {
  const [localChildren, setLocalChildren] = useState(initialChildren);
  const [invites, setInvites] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [requests, setRequests] = useState([]);
  const [caregiverFamilies, setCaregiverFamilies] = useState([]);
  const [loadingCare, setLoadingCare] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [careError, setCareError] = useState('');
  const [discoverable, setDiscoverable] = useState(profile?.discoverable !== false);
  const [savingDiscoverable, setSavingDiscoverable] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLocalChildren(initialChildren);
  }, [initialChildren]);

  useEffect(() => {
    setDiscoverable(profile?.discoverable !== false);
  }, [profile?.discoverable]);

  useEffect(() => {
    if (!profile?.id) {
      setLoadingCare(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoadingCare(true);
    setCareError('');

    Promise.all([
      supabase.rpc('get_own_caregiver_invites'),
      supabase.rpc('get_care_circle_memberships'),
      supabase.rpc('get_care_circle_requests'),
      supabase
        .from('caregiver_access')
        .select('*, children(id, full_name, date_of_birth, gender), profiles!guardian_profile_id(full_name)')
        .eq('caregiver_profile_id', profile.id),
    ]).then(([inviteResult, membershipResult, requestResult, accessResult]) => {
      if (!active) return;

      if (!inviteResult.error && inviteResult.data) setInvites(inviteResult.data);
      if (!membershipResult.error && membershipResult.data) setMemberships(membershipResult.data);
      if (!requestResult.error && requestResult.data) setRequests(requestResult.data);
      if (!accessResult.error && accessResult.data) setCaregiverFamilies(accessResult.data);

      const firstError = inviteResult.error || membershipResult.error || requestResult.error || accessResult.error;
      if (firstError) setCareError(firstError.message || 'Unable to load care circle.');
      setLoadingCare(false);
    });

    return () => {
      active = false;
    };
  }, [profile?.id, reloadKey]);

  const refreshCare = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const handleChildAdded = (child) => {
    setLocalChildren((prev) => [...prev, child]);
    onChildrenChange?.((currentChildren) => [...currentChildren, child]);
    setShowAddChild(false);
  };

  const handleEmailInviteAdded = (invite) => {
    setInvites((prev) => [invite, ...prev]);
  };

  const handleDiscoverableChange = async (e) => {
    const nextValue = e.target.checked;
    setDiscoverable(nextValue);
    setSavingDiscoverable(true);
    setCareError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({ discoverable: nextValue })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      onProfileChange?.(data);
    } catch (err) {
      setDiscoverable(!nextValue);
      setCareError(err.message || 'Unable to update caregiver search setting.');
    } finally {
      setSavingDiscoverable(false);
    }
  };

  const handleAddClick = () => {
    if (profile?.onboarding_completed) {
      onNavigateToAddChild?.();
    } else {
      alert("Please complete your own registration before adding another child.");
    }
  };

  const handleRequestResponse = async (requestId, accept) => {
    const supabase = getSupabaseBrowserClient();
    setCareError('');

    const { error } = await supabase.rpc('respond_care_circle_request', {
      p_request_id: requestId,
      p_accept: accept,
    });

    if (error) {
      setCareError(error.message || 'Unable to update request.');
      return;
    }

    refreshCare();
  };

  const handleRevoke = async (invite) => {
    const supabase = getSupabaseBrowserClient();
    if (invite.status === 'accepted') {
      await supabase.from('caregiver_access').delete().eq('invite_id', invite.id);
    }
    const { error } = await supabase
      .from('caregiver_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id);
    if (!error) {
      setInvites((prev) => prev.map((i) => i.id === invite.id ? { ...i, status: 'revoked' } : i));
    }
  };

  const handleResend = async (invite) => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.functions.invoke('send-caregiver-invite', {
      body: { inviteId: invite.id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  };

  const hasCareCircle = memberships.length > 0;
  const hasPending = requests.length > 0 || invites.length > 0;

  return (
    <div className="family">
      <TopNavBar variant="inner" title="Family" onBack={onBack} />

      <p className="family__section-title">Your Children</p>
      <div className="family__children-list">
        {localChildren.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
        <button className="family__add-card" onClick={handleAddClick}>
          <div className="family__add-icon">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span className="family__add-label">Add a Child</span>
          <ChevronRight size={16} color="var(--dampi-text-muted)" strokeWidth={2} />
        </button>
      </div>

      <label className="family__setting-row" htmlFor="family-discoverable">
        <input
          id="family-discoverable"
          type="checkbox"
          checked={discoverable}
          onChange={handleDiscoverableChange}
          disabled={savingDiscoverable}
        />
        <span>
          <strong>Show me in caregiver search</strong>
          <small>Other Dampi users can find your name and send care-circle requests. Your email and phone stay private.</small>
        </span>
      </label>

      <div className="family__caregivers-header">
        <p className="family__section-title">Care Circle</p>
        <button className="family__invite-btn-sm" onClick={() => setShowInvite(true)}>
          <UserPlus size={14} strokeWidth={2} />
          Add
        </button>
      </div>

      {careError && <p className="family__error family__error--block">{careError}</p>}

      {loadingCare ? (
        <p className="family__loading">Loading...</p>
      ) : !hasCareCircle && !hasPending ? (
        <div className="family__empty">
          <div className="family__empty-icon">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <p className="family__empty-title">No care circle yet</p>
          <p className="family__empty-desc">
            Add a caregiver, grandparent, or family member to help coordinate care.
          </p>
          <button className="family__invite-cta" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} strokeWidth={2} />
            Add to Care Circle
          </button>
        </div>
      ) : (
        <>
          {hasCareCircle && (
            <div className="family__invite-list">
              {memberships.map((member) => (
                <div key={member.id} className="family__invite-row">
                  <PersonAvatar avatarUrl={member.other_avatar_url} name={member.other_full_name} />
                  <div className="family__invite-info">
                    <p className="family__invite-email">{member.other_full_name}</p>
                    <p className="family__invite-child">{formatRelationship(member.relationship_type)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasPending && (
            <>
              <p className="family__section-title family__section-title--spaced">Pending Requests</p>
              <div className="family__invite-list">
                {requests.map((request) => {
                  const isIncoming = request.direction === 'incoming';
                  const otherName = isIncoming ? request.requester_full_name : request.recipient_full_name;
                  const otherAvatar = isIncoming ? request.requester_avatar_url : request.recipient_avatar_url;

                  return (
                    <div key={request.id} className="family__invite-row">
                      <PersonAvatar avatarUrl={otherAvatar} name={otherName} />
                      <div className="family__invite-info">
                        <p className="family__invite-email">{otherName}</p>
                        <p className="family__invite-child">
                          {isIncoming ? 'Wants to connect as ' : 'Requested as '}
                          {formatRelationship(request.relationship_type)}
                          {request.child_name ? ` for ${request.child_name}` : ''}
                        </p>
                      </div>
                      {isIncoming ? (
                        <div className="family__invite-actions">
                          <button
                            className="family__action-btn family__action-btn--ghost"
                            onClick={() => handleRequestResponse(request.id, true)}
                            title="Accept request"
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>
                          <button
                            className="family__action-btn family__action-btn--danger"
                            onClick={() => handleRequestResponse(request.id, false)}
                            title="Decline request"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </div>
                  );
                })}

                {invites.map((inv) => (
                  <div key={inv.id} className="family__invite-row">
                    <div className="family__invite-icon">
                      <Mail size={15} strokeWidth={2} />
                    </div>
                    <div className="family__invite-info">
                      <p className="family__invite-email">{inv.invitee_email}</p>
                      {inv.child_id && (
                        <p className="family__invite-child">
                          {localChildren.find((child) => child.id === inv.child_id)?.full_name || 'Child'}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={inv.status} />
                    {inv.status !== 'revoked' && (
                      <div className="family__invite-actions">
                        {inv.status === 'pending' && (
                          <button
                            className="family__action-btn family__action-btn--ghost"
                            onClick={() => handleResend(inv)}
                            title="Resend invite email"
                          >
                            <RotateCcw size={12} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          className="family__action-btn family__action-btn--danger"
                          onClick={() => handleRevoke(inv)}
                          title={inv.status === 'accepted' ? 'Remove access' : 'Revoke invite'}
                        >
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {caregiverFamilies.length > 0 && (
        <>
          <p className="family__section-title family__section-title--spaced">Families I Care For</p>
          <div className="family__children-list">
            {caregiverFamilies.map((access) => (
              <div key={access.id} className="family__child-card">
                <div className="family__child-avatar">
                  <Baby size={18} strokeWidth={2} />
                </div>
                <div className="family__child-info">
                  <p className="family__child-name">{access.children?.full_name}</p>
                  <p className="family__child-meta">
                    Guardian: {access.profiles?.full_name}
                  </p>
                </div>
                <GenderChip gender={access.children?.gender} />
              </div>
            ))}
          </div>
        </>
      )}

      {showAddChild && (
        <AddChildSheet
          profileId={profile?.id}
          onAdd={handleChildAdded}
          onClose={() => setShowAddChild(false)}
        />
      )}

      {showInvite && (
        <InviteSheet
          children={localChildren}
          profileId={profile?.id}
          onEmailInviteAdded={handleEmailInviteAdded}
          onSent={() => {
            refreshCare();
            setShowInvite(false);
          }}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
