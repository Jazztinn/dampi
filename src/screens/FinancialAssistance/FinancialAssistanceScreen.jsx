import { useEffect, useState } from 'react';
import { Phone, Calendar, Baby, LogOut, ImagePlus, Edit3, Save, X, Mail, Search } from 'lucide-react';
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
  });
  const [discoverable, setDiscoverable] = useState(profile?.discoverable !== false);
  const [savingDiscoverable, setSavingDiscoverable] = useState(false);
  const fullName = profile?.full_name || 'Dampi caregiver';
  const avatarInputId = profile?.id ? `profile-avatar-${profile.id}` : 'profile-avatar-input';
  const childCount = children.length || (child ? 1 : 0);
  const primaryChildName = child?.full_name || children[0]?.full_name || 'No child profile';
  
  const isEmailVerified = profile?.id?.endsWith('@google.com'); // Simple check

  const handleVerifyEmail = async () => {
    if (!profile?.id || savingProfile) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) throw new Error('No email found to verify.');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
      });
      if (error) throw error;
      alert(`Verification email sent to ${session.user.email}`);
    } catch (error) {
      setProfileError(error.message || 'Unable to send verification email.');
    } finally {
      setSavingProfile(false);
    }
  };

  const infoRows = [
    {
      id: 'member-since',
      Icon: Calendar,
      label: 'Member Since',
      value: formatDate(profile?.created_at),
    },
  ];

  if (!isEmailVerified) {
    infoRows.unshift({
      id: 'verify-email',
      Icon: Mail,
      label: 'Verify your email',
      value: 'Connect your email for better security.',
      onClick: handleVerifyEmail,
    });
  }

  useEffect(() => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      child_name: child?.full_name || '',
    });
  }, [profile?.full_name, profile?.phone]);

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileError('');
  };

  const cancelProfileEdit = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setProfileError('');
    setEditingProfile(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profile?.id || savingProfile) return;

    const nextName = profileForm.full_name.trim();
    const nextPhone = profileForm.phone.trim();

    if (!nextName) {
      setProfileError('Name is required.');
      return;
    }

    if (!nextPhone) {
      setProfileError('Phone number is required.');
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
      
      onProfileChange?.(updatedProfile);
      setEditingProfile(false);
    } catch (error) {
      setProfileError(error.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDiscoverableChange = async (e) => {
    const nextValue = e.target.checked;
    setDiscoverable(nextValue);
    setSavingDiscoverable(true);
    // setCareError(''); // if you have an error state for this section

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
      // setCareError(err.message || 'Unable to update setting.');
    } finally {
      setSavingDiscoverable(false);
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
      </div>

      <div className="profile__info-list">
        <div className="profile__info-row">
          <div className="profile__info-icon">
            <Edit3 size={16} strokeWidth={2} />
          </div>
          <div className="profile__info-content">
            <p className="profile__info-label">Full Name</p>
            <p className="profile__info-value">{profile?.full_name || 'Not set'}</p>
          </div>
        </div>
        <div className="profile__info-row">
          <div className="profile__info-icon">
            <Phone size={16} strokeWidth={2} />
          </div>
          <div className="profile__info-content">
            <p className="profile__info-label">Phone Number</p>
            <p className="profile__info-value">{profile?.phone || 'Not set'}</p>
          </div>
        </div>
        {infoRows.map(({ id, Icon, label, value, onClick }) => (
          <div 
            key={id} 
            className={`profile__info-row${onClick ? ' profile__info-row--clickable' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
          >
            <div className="profile__info-icon">
              <Icon size={16} strokeWidth={2} />
            </div>
            <div className="profile__info-content">
              <p className="profile__info-label">{label}</p>
              <p className="profile__info-value">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {profileError && <p className="profile__form-error" style={{ marginBottom: '16px' }}>{profileError}</p>}

      <div className="profile__section-header">
        <p className="profile__section-title">Privacy & Discovery</p>
      </div>

      <div className="profile__info-list">
        <label className="profile__setting-row" htmlFor="family-discoverable">
          <div className="profile__info-icon">
            <Search size={16} strokeWidth={2} />
          </div>
          <div className="profile__setting-content">
            <strong>Show me in caregiver search</strong>
            <small>Allow other Dampi users to find your profile and send requests.</small>
          </div>
          <div className="profile__switch">
            <input
              id="family-discoverable"
              type="checkbox"
              checked={discoverable}
              onChange={handleDiscoverableChange}
              disabled={savingDiscoverable}
            />
            <span className="profile__switch-slider" />
          </div>
        </label>
      </div>

      <div className="profile__sign-out-row" style={{ marginTop: '48px', paddingBottom: '60px' }}>
        <button type="button" className="profile__sign-out-btn" onClick={onSignOut} disabled={signingOut}>
          <LogOut size={18} strokeWidth={2} />
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
