import { useEffect, useState } from 'react';
import { Phone, Calendar, Baby, LogOut, ImagePlus, Edit3, Save, X } from 'lucide-react';
import TopNavBar, { getInitials } from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './financial-assistance.css';

function formatDate(date) {
  if (!date) return 'Not available';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatRole(role) {
  return role
    ? role.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Caregiver';
}

export default function FinancialAssistanceScreen({
  profile,
  child,
  children = [],
  onBack,
  onSignOut,
  onProfileChange,
  onChildrenChange,
  signingOut = false,
}) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    child_name: child?.full_name || '',
  });
  const fullName = profile?.full_name || 'Dampi caregiver';
  const avatarInputId = profile?.id ? `profile-avatar-${profile.id}` : 'profile-avatar-input';
  const childCount = children.length || (child ? 1 : 0);
  const primaryChildName = child?.full_name || children[0]?.full_name || 'No child profile';
  const infoRows = [
    {
      id: 'contact',
      Icon: Phone,
      label: 'Contact',
      value: profile?.phone || 'Not provided',
    },
    {
      id: 'children',
      Icon: Baby,
      label: childCount === 1 ? 'Child Profile' : 'Child Profiles',
      value: childCount > 1 ? `${childCount} children linked` : primaryChildName,
    },
    {
      id: 'member-since',
      Icon: Calendar,
      label: 'Member Since',
      value: formatDate(profile?.created_at),
    },
  ];

  useEffect(() => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      child_name: child?.full_name || '',
    });
  }, [profile?.full_name, profile?.phone, child?.full_name]);

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileError('');
  };

  const cancelProfileEdit = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      child_name: child?.full_name || '',
    });
    setProfileError('');
    setEditingProfile(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profile?.id || savingProfile) return;

    const nextName = profileForm.full_name.trim();
    const nextPhone = profileForm.phone.trim();
    const nextChildName = profileForm.child_name.trim();

    if (!nextName) {
      setProfileError('Name is required.');
      return;
    }

    if (!nextPhone) {
      setProfileError('Phone number is required.');
      return;
    }
    
    if (!nextChildName && child) {
      setProfileError('Child name is required.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ full_name: nextName, phone: nextPhone })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;
      
      if (child && child.id && nextChildName !== child.full_name) {
        const { data: updatedChildData, error: childError } = await supabase
          .from('children')
          .update({ full_name: nextChildName })
          .eq('id', child.id)
          .select('*')
          .single();
          
        if (childError) throw childError;
        
        onChildrenChange?.((prevChildren) => {
          return prevChildren.map((c) => c.id === child.id ? updatedChildData : c);
        });
      }

      onProfileChange?.(updatedProfile);
      setEditingProfile(false);
    } catch (error) {
      setProfileError(error.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !profile?.id || uploadingAvatar) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file for your profile photo.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const objectPath = `${profile.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(objectPath, file, {
          cacheControl: '3600',
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(objectPath);

      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      onProfileChange?.(updatedProfile);
    } catch (error) {
      setAvatarError(error.message || 'Unable to update your profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    document.getElementById(avatarInputId)?.click();
  };

  return (
    <div className="profile">
      <TopNavBar variant="inner" title="Settings" onBack={onBack} />

      <div className="profile__identity">
        <label
          className={`profile__avatar${uploadingAvatar ? ' profile__avatar--loading' : ''}`}
          htmlFor={avatarInputId}
          onKeyDown={handleAvatarKeyDown}
          role="button"
          tabIndex={0}
        >
          <input
            id={avatarInputId}
            className="profile__avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="profile__avatar-image" />
          ) : (
            <span className="profile__avatar-initials">{getInitials(profile?.full_name)}</span>
          )}
          <span className="profile__avatar-overlay" aria-hidden="true">
            <ImagePlus size={20} strokeWidth={2.2} />
          </span>
          <span className="sr-only">Add profile photo</span>
        </label>
        <div>
          <p className="profile__name">{fullName}</p>
          <p className="profile__meta">
            {formatRole(profile?.role)}
          </p>
        </div>
      </div>

      {avatarError && <div className="profile__upload-error" role="status">{avatarError}</div>}

      <div className="profile__section-header">
        <p className="profile__section-title">Account Information</p>
        {!editingProfile ? (
          <button type="button" className="profile__edit-btn" onClick={() => setEditingProfile(true)}>
            <Edit3 size={14} />
            Edit
          </button>
        ) : (
          <button type="button" className="profile__edit-btn" onClick={cancelProfileEdit} disabled={savingProfile}>
            <X size={15} />
            Cancel
          </button>
        )}
      </div>

      {editingProfile ? (
        <form className="profile__edit-form" onSubmit={handleProfileSave}>
          <label htmlFor="profile-full-name">Name</label>
          <input
            id="profile-full-name"
            name="full_name"
            type="text"
            value={profileForm.full_name}
            onChange={handleProfileFieldChange}
            disabled={savingProfile}
          />

          <label htmlFor="profile-phone">Phone</label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            value={profileForm.phone}
            onChange={handleProfileFieldChange}
            disabled={savingProfile}
          />

          {child && (
            <>
              <label htmlFor="profile-child-name">Child's Name</label>
              <input
                id="profile-child-name"
                name="child_name"
                type="text"
                value={profileForm.child_name}
                onChange={handleProfileFieldChange}
                disabled={savingProfile}
              />
            </>
          )}

          {profileError && <p className="profile__form-error">{profileError}</p>}

          <button type="submit" className="profile__save-btn" disabled={savingProfile}>
            <Save size={16} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="profile__info-list">
          {infoRows.map(({ id, Icon, label, value }) => (
            <div key={id} className="profile__info-row">
              <div className="profile__info-icon">
                <Icon size={16} strokeWidth={2} />
              </div>
              <div>
                <p className="profile__info-label">{label}</p>
                <p className="profile__info-value">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="profile__sign-out-row">
        <button type="button" className="profile__sign-out-btn" onClick={onSignOut} disabled={signingOut}>
          <LogOut size={18} strokeWidth={2} />
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
