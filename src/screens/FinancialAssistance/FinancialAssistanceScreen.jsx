import { useState } from 'react';
import { Phone, Calendar, Baby, FileText, ChevronRight, LogOut, ImagePlus } from 'lucide-react';
import TopNavBar, { getInitials } from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
import './financial-assistance.css';

const ACTIONS = [
  {
    id: 1,
    iconClass: 'sage',
    Icon: FileText,
    title: 'Financial Assistance',
    desc: 'Review available support options for your household.',
  },
  {
    id: 2,
    iconClass: 'warm',
    Icon: FileText,
    title: 'Document Requests',
    desc: 'Prepare documents tied to your Dampi profile.',
  },
];

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

export default function FinancialAssistanceScreen({ profile, child, children = [], onBack, onSignOut, onProfileChange }) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
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
      <TopNavBar variant="inner" title="My Profile" onBack={onBack} />

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

      <p className="profile__section-title">Personal Information</p>
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

      <p className="profile__section-title">Assistance</p>
      <div className="profile__actions">
        {ACTIONS.map(({ id, iconClass, Icon, title, desc }) => (
          <button key={id} className="profile__action-card">
            <div className={`profile__action-icon profile__action-icon--${iconClass}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="profile__action-text">
              <p className="profile__action-title">{title}</p>
              <p className="profile__action-desc">{desc}</p>
            </div>
            <ChevronRight size={18} color="var(--dampi-text-muted)" strokeWidth={2} />
          </button>
        ))}
      </div>

      <div className="profile__sign-out-row">
        <button className="profile__sign-out-btn" onClick={onSignOut}>
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
